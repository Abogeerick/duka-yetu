import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import MpesaCheckout from '../components/MpesaCheckout';
import api from '../config/api';

const formatKES = (n) => `KSh ${n.toLocaleString()}`;

export default function Checkout() {
  const { items, total, clearCart } = useCart();
  const navigate = useNavigate();
  const [form, setForm] = useState({ customer_name: '', customer_phone: '', customer_email: '', delivery_address: '', delivery_city: 'Nairobi' });
  const [orderId, setOrderId] = useState(null);
  const [orderTotal, setOrderTotal] = useState(0);
  const [error, setError] = useState('');
  const [step, setStep] = useState('details'); // details | payment

  if (items.length === 0 && !orderId) {
    navigate('/cart');
    return null;
  }

  const deliveryFee = form.delivery_city?.toLowerCase() === 'nairobi' ? 300 : 500;
  const grandTotal = total + deliveryFee;

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

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
    <div className="checkout-page">
      <button className="back-link" onClick={() => navigate(-1)}>← Back</button>
      <h2 className="section-title" style={{ textAlign: 'left', fontSize: 24, marginBottom: 32 }}>Checkout</h2>

      {/* Order Summary */}
      <div style={{ background: '#f8f8f6', padding: 20, marginBottom: 28 }}>
        <span className="label">Order Summary</span>
        {items.map((item) => (
          <div key={item.key} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
            <span>{item.product_name} × {item.quantity} ({item.size})</span>
            <span>{formatKES(item.unit_price * item.quantity)}</span>
          </div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#666', marginBottom: 8 }}>
          <span>Delivery</span><span>{formatKES(deliveryFee)}</span>
        </div>
        <div style={{ borderTop: '1px solid #ddd', marginTop: 8, paddingTop: 8, display: 'flex', justifyContent: 'space-between', fontWeight: 600, fontSize: 15 }}>
          <span>TOTAL</span><span>{formatKES(grandTotal)}</span>
        </div>
      </div>

      {step === 'details' && (
        <>
          <span className="label">Delivery Details</span>
          <input className="input" name="customer_name" placeholder="Full Name *" value={form.customer_name} onChange={handleChange} />
          <input className="input" name="customer_phone" placeholder="Phone Number (07XXXXXXXX) *" value={form.customer_phone} onChange={handleChange} />
          <input className="input" name="customer_email" placeholder="Email (optional)" value={form.customer_email} onChange={handleChange} />
          <input className="input" name="delivery_address" placeholder="Delivery Address / Estate *" value={form.delivery_address} onChange={handleChange} />
          <select className="input" name="delivery_city" value={form.delivery_city} onChange={handleChange} style={{ background: '#fff' }}>
            <option value="Nairobi">Nairobi (KSh 300)</option>
            <option value="Mombasa">Mombasa (KSh 500)</option>
            <option value="Kisumu">Kisumu (KSh 500)</option>
            <option value="Other">Other (KSh 500)</option>
          </select>

          {error && <p style={{ color: 'var(--color-accent)', fontSize: 13, marginBottom: 12 }}>{error}</p>}

          <button className="btn-primary" onClick={createOrder} style={{ marginTop: 8 }}>
            Continue to Payment
          </button>
        </>
      )}

      {step === 'payment' && orderId && (
        <MpesaCheckout orderId={orderId} amount={orderTotal} onSuccess={handlePaymentSuccess} />
      )}
    </div>
  );
}
