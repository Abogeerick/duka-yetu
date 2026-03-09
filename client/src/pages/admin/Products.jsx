import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import api from '../../config/api';

const formatKES = (n) => `KSh ${n.toLocaleString()}`;

export default function AdminProducts() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [filter, setFilter] = useState('all'); // all, published, draft

  useEffect(() => {
    if (!isAdmin) { navigate('/login'); return; }
    loadProducts();
  }, [isAdmin, navigate]);

  const loadProducts = () => {
    api.get('/products/admin/all').then(({ data }) => setProducts(data)).catch(console.error);
  };

  const deleteProduct = async (id, name) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/products/${id}`);
      loadProducts();
    } catch (err) {
      alert('Failed to delete product');
    }
  };

  const togglePublish = async (product) => {
    try {
      await api.put(`/products/${product.id}`, { is_published: !product.is_published });
      loadProducts();
    } catch (err) {
      alert('Failed to update product');
    }
  };

  const filtered = filter === 'all'
    ? products
    : filter === 'published'
      ? products.filter(p => p.is_published)
      : products.filter(p => !p.is_published);

  if (!isAdmin) return null;

  return (
    <motion.div
      className="admin-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className="admin-header">
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 400, letterSpacing: 3 }}>
            Products ({products.length})
          </h2>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            {['all', 'published', 'draft'].map(f => (
              <button
                key={f}
                className="btn-outline"
                onClick={() => setFilter(f)}
                style={filter === f ? { background: 'var(--color-text)', color: '#fff', borderColor: 'var(--color-text)' } : { padding: '6px 16px', fontSize: 10 }}
              >
                {f} ({f === 'all' ? products.length : f === 'published' ? products.filter(p => p.is_published).length : products.filter(p => !p.is_published).length})
              </button>
            ))}
          </div>
        </div>
        <Link to="/admin/products/new" className="btn-primary" style={{ width: 'auto', padding: '12px 28px' }}>
          + Add Product
        </Link>
      </div>

      <table className="admin-table">
        <thead>
          <tr>
            <th>Image</th>
            <th>Name</th>
            <th>Category</th>
            <th>Price</th>
            <th>Stock</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((p) => (
            <tr key={p.id}>
              <td>
                <img
                  src={p.images?.[0] || 'https://via.placeholder.com/60x80'}
                  alt=""
                  style={{ width: 50, height: 67, objectFit: 'cover', borderRadius: 4 }}
                />
              </td>
              <td>
                <div style={{ fontWeight: 500, marginBottom: 2 }}>{p.name}</div>
                {p.badge && <span className={`card-badge ${p.badge.toLowerCase()}`} style={{ position: 'static', fontSize: 9, padding: '2px 8px' }}>{p.badge}</span>}
              </td>
              <td style={{ textTransform: 'capitalize' }}>{p.category}</td>
              <td>
                {formatKES(p.price)}
                {p.compare_price && (
                  <div style={{ fontSize: 11, color: 'var(--color-muted)', textDecoration: 'line-through' }}>{formatKES(p.compare_price)}</div>
                )}
              </td>
              <td>
                <span style={{ color: p.stock <= 5 ? 'var(--color-accent)' : 'inherit', fontWeight: p.stock <= 5 ? 600 : 400 }}>
                  {p.stock}
                </span>
              </td>
              <td>
                <button
                  onClick={() => togglePublish(p)}
                  className={`status-badge ${p.is_published ? 'paid' : 'pending'}`}
                  style={{ border: 'none', cursor: 'pointer' }}
                  title={`Click to ${p.is_published ? 'unpublish' : 'publish'}`}
                >
                  {p.is_published ? 'Published' : 'Draft'}
                </button>
              </td>
              <td>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Link to={`/admin/products/${p.id}`} style={{ fontSize: 12, color: '#0066cc', fontWeight: 500 }}>Edit</Link>
                  <button
                    onClick={() => deleteProduct(p.id, p.name)}
                    style={{ border: 'none', background: 'none', fontSize: 12, color: 'var(--color-accent)', cursor: 'pointer', fontWeight: 500 }}
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </motion.div>
  );
}
