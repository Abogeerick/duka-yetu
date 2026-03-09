import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../context/CartContext';

const formatKES = (n) => `KSh ${n.toLocaleString()}`;

export default function Cart() {
  const { items, removeItem, updateQuantity, total } = useCart();

  if (items.length === 0) {
    return (
      <motion.div
        className="cart-page"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="section-title">Your Cart</h2>
        <div className="section-line" />
        <div className="empty-state">
          <div style={{ fontSize: 56, marginBottom: 16, opacity: 0.3 }}>🛒</div>
          <p>Your cart is empty</p>
          <div className="mt-4">
            <Link to="/shop" className="btn-outline">Continue Shopping</Link>
          </div>
        </div>
      </motion.div>
    );
  }

  const deliveryFee = 300;

  return (
    <motion.div
      className="cart-page"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="section-title">Your Cart</h2>
      <div className="section-line" />

      <AnimatePresence>
        {items.map((item) => (
          <motion.div
            key={item.key}
            className="cart-item"
            layout
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20, height: 0, padding: 0 }}
            transition={{ duration: 0.3 }}
          >
            <img src={item.product_image} alt={item.product_name} />
            <div className="cart-item-info">
              <div className="cart-item-name">{item.product_name}</div>
              <div className="cart-item-meta">
                Size: {item.size} {item.color && `| Color: ${item.color}`}
              </div>
              <div className="cart-item-price">{formatKES(item.unit_price)}</div>
              <div className="qty-controls">
                <button className="qty-btn" onClick={() => updateQuantity(item.key, -1)}>−</button>
                <span style={{ fontSize: 14, fontWeight: 500, minWidth: 20, textAlign: 'center' }}>{item.quantity}</span>
                <button className="qty-btn" onClick={() => updateQuantity(item.key, 1)}>+</button>
                <button className="remove-btn" onClick={() => removeItem(item.key)}>Remove</button>
              </div>
            </div>
            <div style={{ fontWeight: 600, fontSize: 15, whiteSpace: 'nowrap' }}>
              {formatKES(item.unit_price * item.quantity)}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      <motion.div
        className="cart-summary"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, fontSize: 14 }}>
          <span>Subtotal</span><span>{formatKES(total)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, fontSize: 14, color: 'var(--color-muted)' }}>
          <span>Delivery (Nairobi)</span><span>{formatKES(deliveryFee)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--color-border)', paddingTop: 16, fontWeight: 600, fontSize: 17 }}>
          <span>TOTAL</span><span>{formatKES(total + deliveryFee)}</span>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <Link to="/checkout" className="btn-primary" style={{ display: 'block', textAlign: 'center', marginTop: 20 }}>
          Proceed to Checkout
        </Link>
        <Link to="/shop" className="btn-ghost" style={{ display: 'block', textAlign: 'center', marginTop: 8, width: '100%' }}>
          Continue Shopping
        </Link>
      </motion.div>
    </motion.div>
  );
}
