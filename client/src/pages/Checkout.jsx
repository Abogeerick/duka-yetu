import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import MpesaCheckout from '../components/MpesaCheckout';
import api from '../config/api';

const formatKES = (n) => `KSh ${n.toLocaleString()}`;

export default function Checkout() {
  const { items, total, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [guestConfirmed, setGuestConfirmed] = useState(false);
  const [form, setForm] = useState({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    delivery_address: '',
    delivery_city: 'Nairobi',
  });
  const [orderId, setOrderId] = useState(null);
  const [orderTotal, setOrderTotal] = useState(0);
  const [error, setError] = useState('');
  const [step, setStep] = useState('details');

  // Pre-fill form when user data is available
  useEffect(() => {
    if (user) {
      setForm(prev => ({
        ...prev,
        customer_name: user.profile?.full_name || prev.customer_name,
        customer_phone: user.profile?.phone || prev.customer_phone,
        customer_email: user.email || prev.customer_email,
        delivery_address: user.profile?.address || prev.delivery_address,
      }));
      setGuestConfirmed(true);
    }
  }, [user]);

  // Show login prompt for non-logged-in users
  useEffect(() => {
    if (!user && !guestConfirmed && items.length > 0) {
      setShowLoginPrompt(true);
    }
  }, [user, guestConfirmed, items.length]);

  if (items.length === 0 && !orderId) {
    navigate('/cart');
    return null;
  }

  const deliveryFee = form.delivery_city?.toLowerCase() === 'nairobi' ? 300 : 500;
  const grandTotal = total + deliveryFee;

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const continueAsGuest = () => {
    setShowLoginPrompt(false);
    setGuestConfirmed(true);
  };

  const createOrder = async () => {
    setError('');
    if (!form.customer_name || !form.customer_phone || !form.delivery_address) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      const { data: order } = await api.post('/orders', {
        ...form,
        items: items.map((i) => ({
          product_id: i.product_id,
          product_name: i.product_name,
          product_image: i.product_image,
          size: i.size,
          color: i.color,
          quantity: i.quantity,
          unit_price: i.unit_price,
        })),
        payment_method: 'mpesa',
      });

      setOrderId(order.id);
      setOrderTotal(order.total);
      setStep('payment');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create order');
    }
  };

  const handlePaymentSuccess = () => {
    clearCart();
    setTimeout(() => navigate('/'), 4000);
  };

  return (
    <motion.div
      className="checkout-page"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Login Prompt Modal */}
      <AnimatePresence>
        {showLoginPrompt && (
          <motion.div
            className="login-prompt-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="login-prompt"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', damping: 25 }}
            >
              <div style={{ fontSize: 48, marginBottom: 16 }}>👋</div>
              <h3>Have an Account?</h3>
              <p>
                Sign in for a faster checkout experience, order tracking, and exclusive offers.
                Or continue as a guest — no account needed!
              </p>
              <div className="btn-group">
                <Link to="/login?redirect=/checkout" className="btn-primary" style={{ textAlign: 'center' }}>
                  Sign In / Register
                </Link>
                <button className="btn-outline" onClick={continueAsGuest} style={{ width: '100%' }}>
                  Continue as Guest
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <button className="back-link" onClick={() => navigate(-1)}>← Back</button>
      <h2 className="section-title" style={{ textAlign: 'left', fontSize: 24, marginBottom: 32 }}>Checkout</h2>

      {/* Order Summary */}
      <div className="checkout-section">
        <span className="label">Order Summary</span>
        {items.map((item) => (
          <div key={item.key} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
            <span style={{ color: 'var(--color-text-secondary)' }}>{item.product_name} × {item.quantity} ({item.size})</span>
            <span style={{ fontWeight: 500 }}>{formatKES(item.unit_price * item.quantity)}</span>
          </div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--color-muted)', marginBottom: 8 }}>
          <span>Delivery</span><span>{formatKES(deliveryFee)}</span>
        </div>
        <div style={{ borderTop: '1px solid var(--color-border)', marginTop: 12, paddingTop: 12, display: 'flex', justifyContent: 'space-between', fontWeight: 600, fontSize: 16 }}>
          <span>TOTAL</span><span>{formatKES(grandTotal)}</span>
        </div>
      </div>

      {step === 'details' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <span className="label">Delivery Details</span>
          <input className="input" name="customer_name" placeholder="Full Name *" value={form.customer_name} onChange={handleChange} />
          <input className="input" name="customer_phone" placeholder="Phone (07XXXXXXXX) *" value={form.customer_phone} onChange={handleChange} />
          <input className="input" name="customer_email" placeholder="Email (optional)" value={form.customer_email} onChange={handleChange} />
          <input className="input" name="delivery_address" placeholder="Delivery Address / Estate *" value={form.delivery_address} onChange={handleChange} />
          <select className="input" name="delivery_city" value={form.delivery_city} onChange={handleChange} style={{ background: 'var(--color-surface)' }}>
            <option value="Nairobi">Nairobi (KSh 300)</option>
            <option value="Mombasa">Mombasa (KSh 500)</option>
            <option value="Kisumu">Kisumu (KSh 500)</option>
            <option value="Other">Other (KSh 500)</option>
          </select>

          {error && <p style={{ color: 'var(--color-accent)', fontSize: 13, marginBottom: 12 }}>{error}</p>}

          <button className="btn-primary" onClick={createOrder} style={{ marginTop: 8 }}>
            Continue to Payment — {formatKES(grandTotal)}
          </button>
        </motion.div>
      )}

      {step === 'payment' && orderId && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <MpesaCheckout orderId={orderId} amount={orderTotal} onSuccess={handlePaymentSuccess} />
        </motion.div>
      )}
    </motion.div>
  );
}
