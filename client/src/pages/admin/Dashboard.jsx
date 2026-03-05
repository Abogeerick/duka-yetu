import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../config/api';

const formatKES = (n) => `KSh ${n.toLocaleString()}`;

export default function AdminDashboard() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);

  useEffect(() => {
    if (!isAdmin) { navigate('/login'); return; }

    api.get('/orders/admin/stats').then(({ data }) => setStats(data)).catch(console.error);
    api.get('/orders/admin/all').then(({ data }) => setRecentOrders(data.slice(0, 10))).catch(console.error);
  }, [isAdmin, navigate]);

  if (!isAdmin) return null;

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h2 className="section-title" style={{ textAlign: 'left', marginBottom: 0 }}>Dashboard</h2>
        <div style={{ display: 'flex', gap: 12 }}>
          <Link to="/admin/products" className="btn-outline">Products</Link>
          <Link to="/admin/orders" className="btn-outline">Orders</Link>
          <Link to="/admin/products/new" className="btn-primary" style={{ width: 'auto', padding: '10px 24px' }}>+ Add Product</Link>
        </div>
      </div>

      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="value">{stats.totalOrders}</div>
            <span className="label">Total Orders</span>
          </div>
          <div className="stat-card">
            <div className="value">{formatKES(stats.totalRevenue)}</div>
            <span className="label">Revenue (Paid)</span>
          </div>
          <div className="stat-card">
            <div className="value">{stats.pendingOrders}</div>
            <span className="label">Pending Orders</span>
          </div>
          <div className="stat-card">
            <div className="value">{stats.deliveredOrders}</div>
            <span className="label">Delivered</span>
          </div>
        </div>
      )}

      <h3 style={{ fontSize: 14, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 16 }}>Recent Orders</h3>
      {recentOrders.length === 0 ? (
        <p className="empty-state">No orders yet</p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Order #</th>
              <th>Customer</th>
              <th>Total</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {recentOrders.map((o) => (
              <tr key={o.id}>
                <td>{o.order_number}</td>
                <td>{o.customer_name}</td>
                <td>{formatKES(o.total)}</td>
                <td><span className={`status-badge ${o.status}`}>{o.status}</span></td>
                <td>{new Date(o.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
