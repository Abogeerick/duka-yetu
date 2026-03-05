import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../config/api';

const formatKES = (n) => `KSh ${n.toLocaleString()}`;

export default function AdminProducts() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);

  useEffect(() => {
    if (!isAdmin) { navigate('/login'); return; }
    loadProducts();
  }, [isAdmin, navigate]);

  const loadProducts = () => {
    api.get('/products/admin/all').then(({ data }) => setProducts(data)).catch(console.error);
  };

  const deleteProduct = async (id, name) => {
    if (!confirm(`Delete "${name}"?`)) return;
    try {
      await api.delete(`/products/${id}`);
      loadProducts();
    } catch (err) {
      alert('Failed to delete product');
    }
  };

  if (!isAdmin) return null;

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h2 className="section-title" style={{ textAlign: 'left', marginBottom: 0 }}>Products ({products.length})</h2>
        <Link to="/admin/products/new" className="btn-primary" style={{ width: 'auto', padding: '10px 24px' }}>+ Add Product</Link>
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
          {products.map((p) => (
            <tr key={p.id}>
              <td>
                <img
                  src={p.images?.[0] || 'https://via.placeholder.com/60x80'}
                  alt=""
                  style={{ width: 50, height: 67, objectFit: 'cover' }}
                />
              </td>
              <td style={{ fontWeight: 500 }}>{p.name}</td>
              <td>{p.category}</td>
              <td>{formatKES(p.price)}</td>
              <td>{p.stock}</td>
              <td>
                <span className={`status-badge ${p.is_published ? 'paid' : 'pending'}`}>
                  {p.is_published ? 'Published' : 'Draft'}
                </span>
              </td>
              <td>
                <Link to={`/admin/products/${p.id}`} style={{ marginRight: 12, fontSize: 12, color: '#0066cc' }}>Edit</Link>
                <button onClick={() => deleteProduct(p.id, p.name)} style={{ border: 'none', background: 'none', fontSize: 12, color: 'var(--color-accent)', cursor: 'pointer' }}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
