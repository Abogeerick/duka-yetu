import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import api from '../../config/api';

const formatKES = (n) => `KSh ${n.toLocaleString()}`;

export default function AdminDashboard() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    if (!isAdmin) { navigate('/login'); return; }
    api.get('/orders/admin/stats').then(({ data }) => setStats(data)).catch(console.error);
    api.get('/orders/admin/all').then(({ data }) => setRecentOrders(data.slice(0, 8))).catch(console.error);
    api.get('/products/admin/all').then(({ data }) => setProducts(data)).catch(console.error);
  }, [isAdmin, navigate]);

  if (!isAdmin) return null;

  const lowStock = products.filter(p => p.stock <= 5);

  return (
    <motion.div
      className="admin-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* Header */}
      <div className="admin-header">
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 400, letterSpacing: 3 }}>Dashboard</h2>
        <div style={{ display: 'flex', gap: 12 }}>
          <Link to="/admin/products" className="btn-outline">Products</Link>
          <Link to="/admin/orders" className="btn-outline">Orders</Link>
          <Link to="/admin/products/new" className="btn-primary" style={{ width: 'auto', padding: '10px 24px' }}>+ Add Product</Link>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="stats-grid">
          {[
            { icon: '📦', label: 'Total Orders', value: stats.totalOrders, color: '#E3F2FD' },
            { icon: '💰', label: 'Revenue (Paid)', value: formatKES(stats.totalRevenue), color: '#E8F5E9' },
            { icon: '⏳', label: 'Pending Orders', value: stats.pendingOrders, color: '#FFF3E0' },
            { icon: '✅', label: 'Delivered', value: stats.deliveredOrders, color: '#F3E5F5' },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              className="stat-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <div className="stat-icon" style={{ background: s.color }}>{s.icon}</div>
              <div className="value">{s.value}</div>
              <span className="label">{s.label}</span>
            </motion.div>
          ))}
        </div>
      )}

      {/* Low stock alert */}
      {lowStock.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            background: '#FFF3CD',
            border: '1px solid #FFEEBA',
            borderRadius: 'var(--radius-md)',
            padding: '16px 20px',
            marginBottom: 32,
            fontSize: 13,
          }}
        >
          ⚠️ <strong>Low Stock Alert:</strong>{' '}
          {lowStock.map(p => `${p.name} (${p.stock} left)`).join(', ')}
        </motion.div>
      )}

      {/* Recent Orders */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ fontSize: 13, letterSpacing: 2, textTransform: 'uppercase', fontWeight: 600 }}>Recent Orders</h3>
        <Link to="/admin/orders" style={{ fontSize: 12, color: 'var(--color-muted)' }}>View All →</Link>
      </div>

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
                <td style={{ fontWeight: 500 }}>{o.order_number}</td>
                <td>{o.customer_name}</td>
                <td>{formatKES(o.total)}</td>
                <td><span className={`status-badge ${o.status}`}>{o.status}</span></td>
                <td style={{ fontSize: 12, color: 'var(--color-muted)' }}>{new Date(o.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </motion.div>
  );
}
