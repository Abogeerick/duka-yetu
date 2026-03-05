import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../config/api';

const CATEGORIES = ['dresses', 'maxi', 'mini', 'gowns', 'two-piece', 'jumpsuits'];
const ALL_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

export default function AdminProductForm() {
  const { id } = useParams();
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState({
    name: '', description: '', price: '', compare_price: '',
    category: 'dresses', sizes: ['S', 'M', 'L'], colors: [{ name: 'Black', hex: '#1a1a1a' }],
    images: [], stock: '10', is_published: false, is_featured: false, badge: '',
  });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAdmin) { navigate('/login'); return; }
    if (isEdit) {
      api.get('/products/admin/all')
        .then(({ data }) => {
          const product = data.find((p) => p.id === id);
          if (product) {
            setForm({
              ...product,
              price: String(product.price),
              compare_price: product.compare_price ? String(product.compare_price) : '',
              stock: String(product.stock),
              badge: product.badge || '',
            });
          }
        })
        .catch(console.error);
    }
  }, [id, isAdmin, isEdit, navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
  };

  const toggleSize = (size) => {
    setForm((prev) => ({
      ...prev,
      sizes: prev.sizes.includes(size) ? prev.sizes.filter((s) => s !== size) : [...prev.sizes, size],
    }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const { data } = await api.post('/admin/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setForm((prev) => ({ ...prev, images: [...prev.images, data.url] }));
    } catch (err) {
      setError('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (idx) => {
    setForm((prev) => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const payload = {
        ...form,
        price: Number(form.price),
        compare_price: form.compare_price ? Number(form.compare_price) : null,
        stock: Number(form.stock),
        badge: form.badge || null,
      };

      if (isEdit) {
        await api.put(`/products/${id}`, payload);
      } else {
        await api.post('/products', payload);
      }
      navigate('/admin/products');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  if (!isAdmin) return null;

  return (
    <div className="admin-page">
      <button className="back-link" onClick={() => navigate('/admin/products')}>← Back to Products</button>
      <h2 className="section-title" style={{ textAlign: 'left', fontSize: 24, marginBottom: 32 }}>
        {isEdit ? 'Edit Product' : 'Add New Product'}
      </h2>

      <form className="product-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <span className="label">Product Name *</span>
          <input className="input" name="name" value={form.name} onChange={handleChange} required />
        </div>

        <div className="form-group">
          <span className="label">Description</span>
          <textarea name="description" value={form.description} onChange={handleChange} style={{ width: '100%', padding: 14, border: '1px solid #ddd', minHeight: 120, fontSize: 14, resize: 'vertical' }} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="form-group">
            <span className="label">Price (KES) *</span>
            <input className="input" name="price" type="number" value={form.price} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <span className="label">Compare Price (KES)</span>
            <input className="input" name="compare_price" type="number" value={form.compare_price} onChange={handleChange} placeholder="Original price for sales" />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="form-group">
            <span className="label">Category *</span>
            <select className="input" name="category" value={form.category} onChange={handleChange} style={{ background: '#fff' }}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-group">
            <span className="label">Stock</span>
            <input className="input" name="stock" type="number" value={form.stock} onChange={handleChange} />
          </div>
        </div>

        <div className="form-group">
          <span className="label">Sizes</span>
          <div style={{ display: 'flex', gap: 8 }}>
            {ALL_SIZES.map((s) => (
              <button
                key={s}
                type="button"
                className={`size-btn ${form.sizes.includes(s) ? 'active' : ''}`}
                onClick={() => toggleSize(s)}
              >{s}</button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <span className="label">Badge</span>
          <select className="input" name="badge" value={form.badge} onChange={handleChange} style={{ background: '#fff' }}>
            <option value="">None</option>
            <option value="NEW">NEW</option>
            <option value="SALE">SALE</option>
          </select>
        </div>

        <div className="form-group">
          <span className="label">Images</span>
          <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
          {uploading && <p style={{ fontSize: 12, color: '#666', marginTop: 8 }}>Uploading...</p>}
          <div className="image-preview">
            {form.images.map((url, idx) => (
              <div key={idx} style={{ position: 'relative' }}>
                <img src={url} alt="" />
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  style={{ position: 'absolute', top: 2, right: 2, background: 'red', color: '#fff', border: 'none', borderRadius: '50%', width: 20, height: 20, fontSize: 12, cursor: 'pointer' }}
                >×</button>
              </div>
            ))}
          </div>
        </div>

        <div className="form-group" style={{ display: 'flex', gap: 24 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
            <input type="checkbox" name="is_published" checked={form.is_published} onChange={handleChange} />
            Published
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
            <input type="checkbox" name="is_featured" checked={form.is_featured} onChange={handleChange} />
            Featured
          </label>
        </div>

        {error && <p style={{ color: 'var(--color-accent)', fontSize: 13, marginBottom: 12 }}>{error}</p>}

        <button className="btn-primary" type="submit" disabled={saving}>
          {saving ? 'Saving...' : isEdit ? 'Update Product' : 'Create Product'}
        </button>
      </form>
    </div>
  );
}
