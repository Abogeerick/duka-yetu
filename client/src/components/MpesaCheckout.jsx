import { useState, useEffect, useRef } from 'react';
import api from '../config/api';

const formatKES = (n) => `KSh ${n.toLocaleString()}`;

export default function MpesaCheckout({ orderId, amount, onSuccess }) {
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState('idle'); // idle | pushing | pending | success | failed
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const pollRef = useRef(null);

  // Clean up polling on unmount
  useEffect(() => {
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  const initiatePayment = async () => {
    setError('');
    if (!phone || phone.replace(/\D/g, '').length < 9) {
      setError('Enter a valid phone number');
      return;
    }

    setStatus('pushing');

    try {
      const { data } = await api.post('/mpesa/stkpush', {
        phone: phone.replace(/\D/g, ''),
        orderId,
      });

      setStatus('pending');

      // Poll for payment status every 3 seconds
      let attempts = 0;
      pollRef.current = setInterval(async () => {
        attempts++;
        try {
          const { data: result } = await api.get(`/mpesa/status/${data.checkoutRequestId}`);

          if (result.status === 'completed') {
            clearInterval(pollRef.current);
            setStatus('success');
            setReceipt(result.mpesaReceipt);
            setOrderNumber(result.orderNumber);
            onSuccess?.(result);
          } else if (result.status === 'failed' || result.status === 'cancelled') {
            clearInterval(pollRef.current);
            setStatus('failed');
            setError(result.resultDesc || 'Payment was not completed');
          }
        } catch {}

        // Stop polling after 60 seconds
        if (attempts >= 20) {
          clearInterval(pollRef.current);
          if (status === 'pending') {
            setStatus('failed');
            setError('Payment timed out. Please try again.');
          }
        }
      }, 3000);

    } catch (err) {
      setStatus('idle');
      setError(err.response?.data?.error || 'Failed to initiate payment');
    }
  };

  if (status === 'success') {
    return (
      <div className="payment-success">
        <div style={{ fontSize: 56, marginBottom: 16, color: 'var(--color-success)' }}>✓</div>
        <h3 style={{ color: 'var(--color-success)', marginBottom: 8 }}>Payment Successful!</h3>
        {receipt && <p style={{ color: '#666', fontSize: 13, marginBottom: 4 }}>M-Pesa Receipt: <strong>{receipt}</strong></p>}
        {orderNumber && <p style={{ color: '#666', fontSize: 13 }}>Order: <strong>{orderNumber}</strong></p>}
        <p style={{ color: '#666', fontSize: 13, marginTop: 12 }}>
          You will receive an SMS confirmation shortly.
        </p>
      </div>
    );
  }

  if (status === 'pending') {
    return (
      <div className="payment-pending">
        <div className="spinner" />
        <h3 style={{ fontSize: 14, fontWeight: 600 }}>Waiting for M-Pesa confirmation...</h3>
        <p style={{ color: '#666', fontSize: 12, marginTop: 8 }}>Check your phone and enter your PIN</p>
      </div>
    );
  }

  return (
    <div className="mpesa-box">
      <div className="mpesa-logo">
        <div className="mpesa-icon">M</div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15 }}>Lipa na M-Pesa</div>
          <div style={{ fontSize: 11, color: '#666' }}>STK Push — Enter PIN on your phone</div>
        </div>
      </div>

      <input
        className="input"
        style={{ borderColor: 'var(--color-success)' }}
        placeholder="M-Pesa Phone Number (07XXXXXXXX)"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
      />

      {error && <p style={{ color: 'var(--color-accent)', fontSize: 13, marginBottom: 12 }}>{error}</p>}

      <p style={{ fontSize: 12, color: '#666', lineHeight: 1.6, marginBottom: 16 }}>
        You will receive an STK push prompt on your phone.
        Enter your M-Pesa PIN to complete payment of <strong>{formatKES(amount)}</strong>.
      </p>

      <button
        className="btn-primary btn-mpesa"
        onClick={initiatePayment}
        disabled={status === 'pushing'}
      >
        {status === 'pushing' ? 'Sending STK Push...' : `Pay ${formatKES(amount)} via M-Pesa`}
      </button>
    </div>
  );
}
