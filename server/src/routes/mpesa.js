import { Router } from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { initiateSTKPush, querySTKStatus } from '../services/mpesa.js';
import { formatPhone } from '../utils/helpers.js';

const router = Router();

/**
 * POST /api/mpesa/stkpush
 * Initiate an STK push payment for an order
 * In development: falls back to demo mode if Safaricom sandbox is unreachable
 */
router.post('/stkpush', async (req, res) => {
  try {
    const { phone, orderId } = req.body;

    if (!phone || !orderId) {
      return res.status(400).json({ error: 'Phone number and order ID are required' });
    }

    // Validate order exists
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

    const formattedPhone = formatPhone(phone);

    // Try real M-Pesa STK Push
    let mpesaResponse;
    let isDemoMode = false;

    try {
      mpesaResponse = await initiateSTKPush(
        formattedPhone,
        order.total,
        order.order_number
      );
    } catch (mpesaErr) {
      // If sandbox is down and we're in development, use demo mode
      if (process.env.NODE_ENV !== 'production') {
        console.warn('⚠️  Safaricom sandbox unreachable — using DEMO MODE');
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

    // Store payment record
    const { data: payment, error: paymentError } = await supabaseAdmin
      .from('payments')
      .insert({
        order_id: orderId,
        phone_number: formattedPhone,
        amount: order.total,
        merchant_request_id: mpesaResponse.MerchantRequestID,
        checkout_request_id: mpesaResponse.CheckoutRequestID,
        status: isDemoMode ? 'pending' : 'pending',
      })
      .select()
      .single();

    if (paymentError) throw paymentError;

    // In demo mode, auto-complete the payment after 5 seconds
    if (isDemoMode) {
      setTimeout(async () => {
        try {
          const demoReceipt = `DEMO${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
          await supabaseAdmin
            .from('payments')
            .update({
              status: 'completed',
              mpesa_receipt: demoReceipt,
              result_code: 0,
              result_desc: 'DEMO: Payment simulated successfully',
            })
            .eq('id', payment.id);

          await supabaseAdmin
            .from('orders')
            .update({ status: 'paid' })
            .eq('id', orderId);

          console.log(`✅ DEMO: Order ${order.order_number} auto-completed. Receipt: ${demoReceipt}`);
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
 * Safaricom sends payment result here (webhook)
 */
router.post('/callback', async (req, res) => {
  try {
    // Always respond 200 to Safaricom immediately
    res.json({ ResultCode: 0, ResultDesc: 'Accepted' });

    const callback = req.body?.Body?.stkCallback;
    if (!callback) return;

    const {
      MerchantRequestID,
      CheckoutRequestID,
      ResultCode,
      ResultDesc,
      CallbackMetadata,
    } = callback;

    console.log(`M-Pesa callback: ${CheckoutRequestID} → ResultCode: ${ResultCode}`);

    // Extract metadata on success
    let mpesaReceipt = null;
    let amount = null;
    let phoneNumber = null;

    if (ResultCode === 0 && CallbackMetadata?.Item) {
      for (const item of CallbackMetadata.Item) {
        if (item.Name === 'MpesaReceiptNumber') mpesaReceipt = item.Value;
        if (item.Name === 'Amount') amount = item.Value;
        if (item.Name === 'PhoneNumber') phoneNumber = String(item.Value);
      }
    }

    // Update payment record
    const paymentStatus = ResultCode === 0 ? 'completed' : 'failed';
    const { data: payment } = await supabaseAdmin
      .from('payments')
      .update({
        result_code: ResultCode,
        result_desc: ResultDesc,
        mpesa_receipt: mpesaReceipt,
        status: paymentStatus,
      })
      .eq('checkout_request_id', CheckoutRequestID)
      .select('order_id')
      .single();

    // Update order status if payment succeeded
    if (payment && ResultCode === 0) {
      await supabaseAdmin
        .from('orders')
        .update({ status: 'paid' })
        .eq('id', payment.order_id);

      console.log(`Order ${payment.order_id} marked as PAID. Receipt: ${mpesaReceipt}`);
    }
  } catch (err) {
    console.error('Callback processing error:', err);
  }
});

/**
 * GET /api/mpesa/status/:checkoutRequestId
 * Frontend polls this to check payment status
 * If still pending, actively queries Safaricom for the result
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

    // If payment already completed/failed via callback, return immediately
    if (payment.status !== 'pending') {
      return res.json({
        status: payment.status,
        mpesaReceipt: payment.mpesa_receipt,
        resultDesc: payment.result_desc,
        orderStatus: payment.orders?.status,
        orderNumber: payment.orders?.order_number,
      });
    }

    // Payment still pending — actively query Safaricom
    // Skip query for demo mode payments
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
        // Payment succeeded — update DB
        const receipt = queryResult.ResultDesc?.match(/Receipt Number: (\w+)/)?.[1] || null;

        await supabaseAdmin
          .from('payments')
          .update({
            status: 'completed',
            result_code: resultCode,
            result_desc: queryResult.ResultDesc,
            mpesa_receipt: receipt,
          })
          .eq('id', payment.id);

        await supabaseAdmin
          .from('orders')
          .update({ status: 'paid' })
          .eq('id', payment.order_id);

        return res.json({
          status: 'completed',
          mpesaReceipt: receipt,
          resultDesc: queryResult.ResultDesc,
          orderStatus: 'paid',
          orderNumber: payment.orders?.order_number,
        });
      } else if (resultCode === 1032) {
        // User cancelled
        await supabaseAdmin
          .from('payments')
          .update({ status: 'failed', result_code: resultCode, result_desc: 'Transaction cancelled by user' })
          .eq('id', payment.id);

        return res.json({
          status: 'failed',
          mpesaReceipt: null,
          resultDesc: 'Transaction cancelled by user',
          orderStatus: payment.orders?.status,
          orderNumber: payment.orders?.order_number,
        });
      } else if (resultCode === 1037 || resultCode === 1) {
        // Timeout or failed
        await supabaseAdmin
          .from('payments')
          .update({ status: 'failed', result_code: resultCode, result_desc: queryResult.ResultDesc })
          .eq('id', payment.id);

        return res.json({
          status: 'failed',
          mpesaReceipt: null,
          resultDesc: queryResult.ResultDesc || 'Payment timed out. Please try again.',
          orderStatus: payment.orders?.status,
          orderNumber: payment.orders?.order_number,
        });
      }
    } catch (queryErr) {
      // Query failed (maybe too early) — just return pending
      console.log('STK query not ready yet:', queryErr.response?.data?.errorMessage || queryErr.message);
    }

    // Still pending
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
