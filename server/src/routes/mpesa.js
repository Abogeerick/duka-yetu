import { Router } from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { initiateSTKPush, querySTKStatus } from '../services/mpesa.js';
import { formatPhone } from '../utils/helpers.js';

const router = Router();

const NETWORK_ERROR_CODES = ['ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT', 'ECONNRESET', 'EAI_AGAIN'];

/**
 * Settle a pending payment exactly once. Returns the row that was transitioned,
 * or null if another writer (callback vs. poller) already settled it.
 */
async function settlePayment(checkoutRequestId, fields) {
  const { data, error } = await supabaseAdmin
    .from('payments')
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq('checkout_request_id', checkoutRequestId)
    .eq('status', 'pending')
    .select('id, order_id')
    .maybeSingle();
  if (error) throw error;
  return data;
}

/**
 * Mark an order paid only if it's still pending. Prevents clobbering refunded /
 * cancelled / already-paid orders.
 */
async function markOrderPaid(orderId) {
  await supabaseAdmin
    .from('orders')
    .update({ status: 'paid' })
    .eq('id', orderId)
    .eq('status', 'pending');
}

/**
 * POST /api/mpesa/stkpush
 * Initiate an STK push payment for an order.
 * Idempotent: if a payment is already open for this order, returns its checkoutRequestId.
 * In development: falls back to demo mode only when Safaricom is genuinely unreachable.
 */
router.post('/stkpush', async (req, res) => {
  try {
    const { phone, orderId } = req.body;

    if (!phone || !orderId) {
      return res.status(400).json({ error: 'Phone number and order ID are required' });
    }

    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.status !== 'pending') {
      return res.status(400).json({ error: 'Order is not in pending status' });
    }

    // Idempotency: if a payment is already in flight for this order, return it.
    const { data: existing } = await supabaseAdmin
      .from('payments')
      .select('id, checkout_request_id')
      .eq('order_id', orderId)
      .in('status', ['initiated', 'pending'])
      .maybeSingle();

    if (existing) {
      return res.json({
        message: 'A payment is already in progress for this order. Check your phone.',
        checkoutRequestId: existing.checkout_request_id,
        paymentId: existing.id,
        demo: false,
      });
    }

    const formattedPhone = formatPhone(phone);

    let mpesaResponse;
    let isDemoMode = false;

    try {
      mpesaResponse = await initiateSTKPush(
        formattedPhone,
        order.total,
        order.order_number
      );
    } catch (mpesaErr) {
      const isNetworkError = !mpesaErr.response && NETWORK_ERROR_CODES.includes(mpesaErr.code);

      if (isNetworkError && process.env.NODE_ENV !== 'production') {
        console.warn('Safaricom sandbox unreachable — using DEMO MODE');
        isDemoMode = true;
        mpesaResponse = {
          ResponseCode: '0',
          MerchantRequestID: `DEMO-${Date.now()}`,
          CheckoutRequestID: `DEMO-CHK-${Date.now()}`,
        };
      } else {
        throw mpesaErr;
      }
    }

    if (mpesaResponse.ResponseCode !== '0') {
      return res.status(400).json({
        error: 'Failed to initiate payment',
        details: mpesaResponse.ResponseDescription,
      });
    }

    let payment;
    const insertResult = await supabaseAdmin
      .from('payments')
      .insert({
        order_id: orderId,
        phone_number: formattedPhone,
        amount: order.total,
        merchant_request_id: mpesaResponse.MerchantRequestID,
        checkout_request_id: mpesaResponse.CheckoutRequestID,
        status: 'pending',
      })
      .select()
      .single();

    if (insertResult.error) {
      // 23505 = unique violation on uniq_payments_open_per_order: another request
      // beat us by a hair. Return the row that won.
      if (insertResult.error.code === '23505') {
        const { data: winner } = await supabaseAdmin
          .from('payments')
          .select('id, checkout_request_id')
          .eq('order_id', orderId)
          .in('status', ['initiated', 'pending'])
          .maybeSingle();

        if (winner) {
          return res.json({
            message: 'A payment is already in progress for this order. Check your phone.',
            checkoutRequestId: winner.checkout_request_id,
            paymentId: winner.id,
            demo: false,
          });
        }
      }
      throw insertResult.error;
    }

    payment = insertResult.data;

    if (isDemoMode) {
      setTimeout(async () => {
        try {
          const demoReceipt = `DEMO${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
          const settled = await settlePayment(mpesaResponse.CheckoutRequestID, {
            status: 'completed',
            mpesa_receipt: demoReceipt,
            result_code: 0,
            result_desc: 'DEMO: Payment simulated successfully',
          });
          if (settled) {
            await markOrderPaid(settled.order_id);
            console.log(`DEMO: Order ${order.order_number} auto-completed. Receipt: ${demoReceipt}`);
          }
        } catch (e) {
          console.error('Demo auto-complete error:', e.message);
        }
      }, 5000);
    }

    res.json({
      message: isDemoMode
        ? 'DEMO MODE: Payment will auto-complete in 5 seconds.'
        : 'STK push sent. Check your phone to enter M-Pesa PIN.',
      checkoutRequestId: mpesaResponse.CheckoutRequestID,
      paymentId: payment.id,
      demo: isDemoMode,
    });
  } catch (err) {
    const detail = err.response?.data?.errorMessage || err.response?.data || err.message;
    console.error('STK Push error:', detail);
    res.status(500).json({
      error: typeof detail === 'string' ? detail : 'Failed to initiate M-Pesa payment. Check server logs.',
    });
  }
});

/**
 * POST /api/mpesa/callback
 * Safaricom sends payment result here (webhook). Authoritative source for the receipt.
 */
router.post('/callback', async (req, res) => {
  try {
    res.json({ ResultCode: 0, ResultDesc: 'Accepted' });

    const callback = req.body?.Body?.stkCallback;
    if (!callback) return;

    const {
      CheckoutRequestID,
      ResultCode,
      ResultDesc,
      CallbackMetadata,
    } = callback;

    console.log(`M-Pesa callback: ${CheckoutRequestID} → ResultCode: ${ResultCode}`);

    let mpesaReceipt = null;
    if (ResultCode === 0 && CallbackMetadata?.Item) {
      for (const item of CallbackMetadata.Item) {
        if (item.Name === 'MpesaReceiptNumber') mpesaReceipt = item.Value;
      }
    }

    const settled = await settlePayment(CheckoutRequestID, {
      status: ResultCode === 0 ? 'completed' : 'failed',
      result_code: ResultCode,
      result_desc: ResultDesc,
      mpesa_receipt: mpesaReceipt,
    });

    if (settled && ResultCode === 0) {
      await markOrderPaid(settled.order_id);
      console.log(`Order ${settled.order_id} marked as PAID. Receipt: ${mpesaReceipt}`);
      return;
    }

    // Poller already flipped the row to completed but couldn't get the receipt.
    // Backfill the receipt without touching status.
    if (!settled && ResultCode === 0 && mpesaReceipt) {
      await supabaseAdmin
        .from('payments')
        .update({ mpesa_receipt: mpesaReceipt, updated_at: new Date().toISOString() })
        .eq('checkout_request_id', CheckoutRequestID)
        .is('mpesa_receipt', null);
      console.log(`Receipt backfilled for ${CheckoutRequestID}: ${mpesaReceipt}`);
    }
  } catch (err) {
    console.error('Callback processing error:', err);
  }
});

/**
 * GET /api/mpesa/status/:checkoutRequestId
 * Frontend polls this to check payment status.
 * If still pending, actively queries Safaricom for the result.
 */
router.get('/status/:checkoutRequestId', async (req, res) => {
  try {
    const checkoutId = req.params.checkoutRequestId;

    const { data: payment, error } = await supabaseAdmin
      .from('payments')
      .select('*, orders(order_number, status)')
      .eq('checkout_request_id', checkoutId)
      .single();

    if (error || !payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    if (payment.status !== 'pending') {
      return res.json({
        status: payment.status,
        mpesaReceipt: payment.mpesa_receipt,
        resultDesc: payment.result_desc,
        orderStatus: payment.orders?.status,
        orderNumber: payment.orders?.order_number,
      });
    }

    if (checkoutId.startsWith('DEMO-')) {
      return res.json({
        status: payment.status,
        mpesaReceipt: null,
        resultDesc: 'Waiting for payment...',
        orderStatus: payment.orders?.status,
        orderNumber: payment.orders?.order_number,
      });
    }

    try {
      const queryResult = await querySTKStatus(checkoutId);
      console.log('STK Query result:', JSON.stringify(queryResult));

      const resultCode = Number(queryResult.ResultCode);

      if (resultCode === 0) {
        // Receipt is not reliably present in the query response; the callback
        // is the source of truth and will backfill it.
        const settled = await settlePayment(checkoutId, {
          status: 'completed',
          result_code: resultCode,
          result_desc: queryResult.ResultDesc,
        });

        if (settled) await markOrderPaid(settled.order_id);

        // Re-read so we surface whatever the callback already wrote (if it won).
        const { data: fresh } = await supabaseAdmin
          .from('payments')
          .select('mpesa_receipt, result_desc, orders(order_number, status)')
          .eq('checkout_request_id', checkoutId)
          .single();

        return res.json({
          status: 'completed',
          mpesaReceipt: fresh?.mpesa_receipt || null,
          resultDesc: fresh?.result_desc || queryResult.ResultDesc,
          orderStatus: fresh?.orders?.status || 'paid',
          orderNumber: fresh?.orders?.order_number || payment.orders?.order_number,
        });
      } else if (resultCode === 1032) {
        await settlePayment(checkoutId, {
          status: 'failed',
          result_code: resultCode,
          result_desc: 'Transaction cancelled by user',
        });

        return res.json({
          status: 'failed',
          mpesaReceipt: null,
          resultDesc: 'Transaction cancelled by user',
          orderStatus: payment.orders?.status,
          orderNumber: payment.orders?.order_number,
        });
      } else if (resultCode === 1037 || resultCode === 1) {
        await settlePayment(checkoutId, {
          status: 'failed',
          result_code: resultCode,
          result_desc: queryResult.ResultDesc,
        });

        return res.json({
          status: 'failed',
          mpesaReceipt: null,
          resultDesc: queryResult.ResultDesc || 'Payment timed out. Please try again.',
          orderStatus: payment.orders?.status,
          orderNumber: payment.orders?.order_number,
        });
      }
    } catch (queryErr) {
      console.log('STK query not ready yet:', queryErr.response?.data?.errorMessage || queryErr.message);
    }

    res.json({
      status: 'pending',
      mpesaReceipt: null,
      resultDesc: 'Waiting for M-Pesa confirmation...',
      orderStatus: payment.orders?.status,
      orderNumber: payment.orders?.order_number,
    });
  } catch (err) {
    console.error('Status check error:', err);
    res.status(500).json({ error: 'Failed to check payment status' });
  }
});

export default router;
