import { Router } from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { initiateSTKPush, querySTKStatus } from '../services/mpesa.js';
import { formatPhone } from '../utils/helpers.js';

const router = Router();

/**
 * POST /api/mpesa/stkpush
 * Initiate an STK push payment for an order
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

    // Initiate STK Push
    const mpesaResponse = await initiateSTKPush(
      formattedPhone,
      order.total,
      order.order_number
    );

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
        status: 'pending',
      })
      .select()
      .single();

    if (paymentError) throw paymentError;

    res.json({
      message: 'STK push sent. Check your phone to enter M-Pesa PIN.',
      checkoutRequestId: mpesaResponse.CheckoutRequestID,
      paymentId: payment.id,
    });
  } catch (err) {
    console.error('STK Push error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to initiate M-Pesa payment' });
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
 */
router.get('/status/:checkoutRequestId', async (req, res) => {
  try {
    const { data: payment, error } = await supabaseAdmin
      .from('payments')
      .select('*, orders(order_number, status)')
      .eq('checkout_request_id', req.params.checkoutRequestId)
      .single();

    if (error || !payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    res.json({
      status: payment.status,
      mpesaReceipt: payment.mpesa_receipt,
      resultDesc: payment.result_desc,
      orderStatus: payment.orders?.status,
      orderNumber: payment.orders?.order_number,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to check payment status' });
  }
});

export default router;
