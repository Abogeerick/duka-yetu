import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import api from '../../config/api';

const formatKES = (n) => `KSh ${n.toLocaleString()}`;
const STATUSES = ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'];

export default function AdminOrders() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    if (!isAdmin) { navigate('/login'); return; }
    loadOrders();
  }, [isAdmin, navigate]);

  const loadOrders = () => {
    api.get('/orders/admin/all').then(({ data }) => setOrders(data)).catch(console.error);
  };

  const updateStatus = async (orderId, status) => {
    try {
      await api.put(`/orders/admin/${orderId}`, { status });
      loadOrders();
    } catch (err) {
      alert('Failed to update order status');
    }
  };

  const filtered = filter ? orders.filter((o) => o.status === filter) : orders;

  if (!isAdmin) return null;

  return (
    <motion.div
      className="admin-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className="admin-header">
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 400, letterSpacing: 3 }}>
          Orders ({orders.length})
        </h2>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            className="btn-outline"
            onClick={() => setFilter('')}
            style={!filter ? { background: 'var(--color-text)', color: '#fff', borderColor: 'var(--color-text)' } : { padding: '6px 14px', fontSize: 10 }}
          >
            All
          </button>
          {['pending', 'paid', 'processing', 'shipped', 'delivered'].map((s) => (
            <button
              key={s}
              className="btn-outline"
              onClick={() => setFilter(s)}
              style={filter === s ? { background: 'var(--color-text)', color: '#fff', borderColor: 'var(--color-text)' } : { padding: '6px 14px', fontSize: 10 }}
            >
              {s} ({orders.filter(o => o.status === s).length})
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="empty-state">No orders found</p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Order #</th>
              <th>Customer</th>
              <th>Phone</th>
              <th>Items</th>
              <th>Total</th>
              <th>Payment</th>
              <th>Status</th>
              <th>Update</th>
              <th>Date</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((o) => (
              <tr key={o.id}>
                <td style={{ fontWeight: 600 }}>{o.order_number}</td>
                <td>
                  <div>{o.customer_name}</div>
                  <div style={{ fontSize: 11, color: 'var(--color-muted)' }}>{o.customer_email}</div>
                </td>
                <td style={{ fontSize: 12 }}>{o.customer_phone}</td>
                <td>
                  {o.order_items?.map((item) => (
                    <div key={item.id} style={{ fontSize: 11, marginBottom: 2, color: 'var(--color-text-secondary)' }}>
                      {item.product_name} ({item.size}) ×{item.quantity}
                    </div>
                  ))}
                </td>
                <td style={{ fontWeight: 600 }}>{formatKES(o.total)}</td>
                <td>
                  {o.payments?.[0] && (
                    <div>
                      <span className={`status-badge ${o.payments[0].status}`}>{o.payments[0].status}</span>
                      {o.payments[0].mpesa_receipt && (
                        <div style={{ fontSize: 10, color: 'var(--color-muted)', marginTop: 4 }}>{o.payments[0].mpesa_receipt}</div>
                      )}
                    </div>
                  )}
                </td>
                <td><span className={`status-badge ${o.status}`}>{o.status}</span></td>
                <td>
                  <select
                    value={o.status}
                    onChange={(e) => updateStatus(o.id, e.target.value)}
                    style={{ fontSize: 11, padding: '6px 8px', border: '1px solid var(--color-border)', borderRadius: 4, background: 'var(--color-surface)' }}
                  >
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
                <td style={{ fontSize: 12, whiteSpace: 'nowrap', color: 'var(--color-muted)' }}>
                  {new Date(o.created_at).toLocaleDateString()}
                </td>
                <td>
                  <button
                    onClick={() => setSelectedOrder(selectedOrder?.id === o.id ? null : o)}
                    style={{ border: 'none', background: 'none', fontSize: 12, color: '#0066cc', cursor: 'pointer' }}
                  >
                    {selectedOrder?.id === o.id ? 'Close' : 'Details'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Order Detail Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <motion.div
            className="login-prompt-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedOrder(null)}
          >
            <motion.div
              className="login-prompt"
              style={{ maxWidth: 560, textAlign: 'left' }}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h3 style={{ fontSize: 18, letterSpacing: 2 }}>Order {selectedOrder.order_number}</h3>
                <span className={`status-badge ${selectedOrder.status}`}>{selectedOrder.status}</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13, marginBottom: 24 }}>
                <div>
                  <div style={{ color: 'var(--color-muted)', fontSize: 11, marginBottom: 2 }}>CUSTOMER</div>
                  <div style={{ fontWeight: 500 }}>{selectedOrder.customer_name}</div>
                  <div>{selectedOrder.customer_phone}</div>
                  <div>{selectedOrder.customer_email}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--color-muted)', fontSize: 11, marginBottom: 2 }}>DELIVERY</div>
                  <div>{selectedOrder.delivery_address}</div>
                  <div>{selectedOrder.delivery_city}</div>
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 16 }}>
                <div style={{ color: 'var(--color-muted)', fontSize: 11, marginBottom: 8 }}>ITEMS</div>
                {selectedOrder.order_items?.map((item) => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13 }}>
                    <span>{item.product_name} — {item.size} × {item.quantity}</span>
                    <span style={{ fontWeight: 500 }}>{formatKES(item.total_price)}</span>
                  </div>
                ))}
                <div style={{ borderTop: '1px solid var(--color-border)', marginTop: 12, paddingTop: 12, display: 'flex', justifyContent: 'space-between', fontWeight: 600, fontSize: 15 }}>
                  <span>Total</span>
                  <span>{formatKES(selectedOrder.total)}</span>
                </div>
              </div>

              <button className="btn-outline" onClick={() => setSelectedOrder(null)} style={{ marginTop: 24, width: '100%' }}>
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
