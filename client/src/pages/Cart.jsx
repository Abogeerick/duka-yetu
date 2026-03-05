import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';

const formatKES = (n) => `KSh ${n.toLocaleString()}`;

export default function Cart() {
  const { items, removeItem, updateQuantity, total } = useCart();

  if (items.length === 0) {
    return (
      <div className="cart-page">
        <h2 className="section-title">Your Cart</h2>
        <div className="section-line" />
        <p className="empty-state">Your cart is empty</p>
        <div className="text-center">
          <Link to="/shop" className="btn-outline">Continue Shopping</Link>
        </div>
      </div>
    );
  }

  const deliveryFee = 300;

  return (
    <div className="cart-page">
      <h2 className="section-title">Your Cart</h2>
      <div className="section-line" />

      {items.map((item) => (
        <div key={item.key} className="cart-item">
          <img src={item.product_image} alt={item.product_name} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, letterSpacing: 1.5, fontWeight: 500, marginBottom: 4 }}>
              {item.product_name}
            </div>
            <div style={{ fontSize: 12, color: '#888' }}>
              Size: {item.size} {item.color && `| Color: ${item.color}`}
            </div>
            <div style={{ fontSize: 14, marginTop: 8 }}>{formatKES(item.unit_price)}</div>
            <div className="qty-controls">
              <button className="qty-btn" onClick={() => updateQuantity(item.key, -1)}>−</button>
              <span style={{ fontSize: 13 }}>{item.quantity}</span>
              <button className="qty-btn" onClick={() => updateQuantity(item.key, 1)}>+</button>
              <button className="remove-btn" onClick={() => removeItem(item.key)}>Remove</button>
            </div>
          </div>
          <div style={{ fontWeight: 500 }}>{formatKES(item.unit_price * item.quantity)}</div>
        </div>
      ))}

      <div className="cart-summary">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
          <span>Subtotal</span><span>{formatKES(total)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, fontSize: 13, color: '#666' }}>
          <span>Delivery (Nairobi)</span><span>{formatKES(deliveryFee)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #ddd', paddingTop: 12, fontWeight: 600, fontSize: 15 }}>
          <span>TOTAL</span><span>{formatKES(total + deliveryFee)}</span>
        </div>
      </div>

      <Link to="/checkout" className="btn-primary" style={{ display: 'block', textAlign: 'center', marginTop: 16 }}>
        Proceed to Checkout
      </Link>
    </div>
  );
}
