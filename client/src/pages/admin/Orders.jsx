import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../config/api';

const formatKES = (n) => `KSh ${n.toLocaleString()}`;
const STATUSES = ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'];

export default function AdminOrders() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('');

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
    <div className="admin-page">
      <div className="admin-header">
        <h2 className="section-title" style={{ textAlign: 'left', marginBottom: 0 }}>Orders ({orders.length})</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className={`btn-outline ${!filter ? 'active' : ''}`} onClick={() => setFilter('')} style={!filter ? { background: 'var(--color-text)', color: '#fff' } : {}}>
            All
          </button>
          {['pending', 'paid', 'processing', 'shipped'].map((s) => (
            <button
              key={s}
              className="btn-outline"
              onClick={() => setFilter(s)}
              style={filter === s ? { background: 'var(--color-text)', color: '#fff' } : {}}
            >{s}</button>
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
            </tr>
          </thead>
          <tbody>
            {filtered.map((o) => (
              <tr key={o.id}>
                <td style={{ fontWeight: 500 }}>{o.order_number}</td>
                <td>{o.customer_name}</td>
                <td style={{ fontSize: 12 }}>{o.customer_phone}</td>
                <td>
                  {o.order_items?.map((item) => (
                    <div key={item.id} style={{ fontSize: 11, marginBottom: 2 }}>
                      {item.product_name} ({item.size}) ×{item.quantity}
                    </div>
                  ))}
                </td>
                <td style={{ fontWeight: 500 }}>{formatKES(o.total)}</td>
                <td>
                  {o.payments?.[0] && (
                    <span className={`status-badge ${o.payments[0].status}`}>
                      {o.payments[0].status}
                      {o.payments[0].mpesa_receipt && <><br /><small>{o.payments[0].mpesa_receipt}</small></>}
                    </span>
                  )}
                </td>
                <td><span className={`status-badge ${o.status}`}>{o.status}</span></td>
                <td>
                  <select
                    value={o.status}
                    onChange={(e) => updateStatus(o.id, e.target.value)}
                    style={{ fontSize: 11, padding: '4px 8px', border: '1px solid #ddd' }}
                  >
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
                <td style={{ fontSize: 12, whiteSpace: 'nowrap' }}>{new Date(o.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
