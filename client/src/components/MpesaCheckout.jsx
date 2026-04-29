import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../config/api';

const formatKES = (n) => `KSh ${n.toLocaleString()}`;

export default function MpesaCheckout({ orderId, amount, onSuccess }) {
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState('idle'); // idle | pushing | pending | success | failed
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const pollRef = useRef(null);

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
        } catch { }

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
      <motion.div
        className="payment-success"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', damping: 20 }}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.2, stiffness: 200 }}
          style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--color-success-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}
        >
          <span style={{ fontSize: 40, color: 'var(--color-success)' }}>✓</span>
        </motion.div>
        <motion.h3
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          style={{ color: 'var(--color-success)', marginBottom: 12, fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 400, letterSpacing: 2 }}
        >
          Payment Successful!
        </motion.h3>
        {receipt && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} style={{ color: 'var(--color-muted)', fontSize: 13, marginBottom: 4 }}>
            M-Pesa Receipt: <strong style={{ color: 'var(--color-text)' }}>{receipt}</strong>
          </motion.p>
        )}
        {orderNumber && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} style={{ color: 'var(--color-muted)', fontSize: 13 }}>
            Order: <strong style={{ color: 'var(--color-text)' }}>{orderNumber}</strong>
          </motion.p>
        )}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          style={{ color: 'var(--color-muted)', fontSize: 13, marginTop: 16 }}
        >
          You will receive an SMS confirmation shortly. Redirecting...
        </motion.p>
      </motion.div>
    );
  }

  if (status === 'pending') {
    return (
      <motion.div
        className="payment-pending"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="spinner" />
        <h3 style={{ fontSize: 15, fontWeight: 600, letterSpacing: 1 }}>
          Waiting for M-Pesa confirmation...
        </h3>
        <p style={{ color: 'var(--color-muted)', fontSize: 13, marginTop: 8 }}>
          Check your phone and enter your M-Pesa PIN
        </p>
        <motion.div
          style={{ marginTop: 24, display: 'flex', gap: 4, justifyContent: 'center' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {[0, 1, 2].map(i => (
            <motion.div
              key={i}
              style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-success)' }}
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.3 }}
            />
          ))}
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="mpesa-box"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="mpesa-logo">
        <div className="mpesa-icon">M</div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15 }}>Lipa na M-Pesa</div>
          <div style={{ fontSize: 11, color: 'var(--color-muted)' }}>STK Push — Enter PIN on your phone</div>
        </div>
      </div>

      <input
        className="input"
        style={{ borderColor: 'var(--color-success)' }}
        placeholder="M-Pesa Phone Number (07XXXXXXXX)"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
      />

      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ color: 'var(--color-accent)', fontSize: 13, marginBottom: 12 }}
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      <p style={{ fontSize: 12, color: 'var(--color-muted)', lineHeight: 1.8, marginBottom: 16 }}>
        You will receive an STK push prompt on your phone.
        Enter your M-Pesa PIN to complete payment of <strong style={{ color: 'var(--color-text)' }}>{formatKES(amount)}</strong>.
      </p>

      <motion.button
        className="btn-primary btn-mpesa"
        onClick={initiatePayment}
        disabled={status !== 'idle'}
        whileTap={{ scale: 0.98 }}
      >
        {status === 'pushing' ? 'Sending STK Push...' : `Pay ${formatKES(amount)} via M-Pesa`}
      </motion.button>
    </motion.div>
  );
}
