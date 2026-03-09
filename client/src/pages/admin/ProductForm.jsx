import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import api from '../../config/api';

const CATEGORIES = ['dresses', 'maxi', 'mini', 'gowns', 'two-piece', 'jumpsuits'];
const ALL_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const PRESET_COLORS = [
  { name: 'Black', hex: '#1a1a1a' },
  { name: 'White', hex: '#FFFFFF' },
  { name: 'Red', hex: '#8B0000' },
  { name: 'Burgundy', hex: '#800020' },
  { name: 'Emerald', hex: '#004D40' },
  { name: 'Navy', hex: '#1B2A4A' },
  { name: 'Gold', hex: '#D4AF37' },
  { name: 'Cream', hex: '#F5F5DC' },
  { name: 'Rose', hex: '#B76E79' },
  { name: 'Olive', hex: '#556B2F' },
];

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

  const toggleColor = (color) => {
    setForm((prev) => {
      const exists = prev.colors.find(c => c.name === color.name);
      if (exists) {
        return { ...prev, colors: prev.colors.filter(c => c.name !== color.name) };
      }
      return { ...prev, colors: [...prev.colors, color] };
    });
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
    <motion.div
      className="admin-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <button className="back-link" onClick={() => navigate('/admin/products')}>← Back to Products</button>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 400, letterSpacing: 3, marginBottom: 32 }}>
        {isEdit ? 'Edit Product' : 'Add New Product'}
      </h2>

      <form className="product-form" onSubmit={handleSubmit}>
        {/* Basic Info */}
        <div className="form-group">
          <span className="label">Product Name *</span>
          <input className="input" name="name" value={form.name} onChange={handleChange} required placeholder="e.g. Midnight Muse Mini" />
        </div>

        <div className="form-group">
          <span className="label">Description</span>
          <textarea name="description" value={form.description} onChange={handleChange} placeholder="Describe the product..." />
        </div>

        {/* Pricing & Category */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="form-group">
            <span className="label">Price (KES) *</span>
            <input className="input" name="price" type="number" value={form.price} onChange={handleChange} required placeholder="4000" />
          </div>
          <div className="form-group">
            <span className="label">Compare Price (KES)</span>
            <input className="input" name="compare_price" type="number" value={form.compare_price} onChange={handleChange} placeholder="Original price for sales" />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="form-group">
            <span className="label">Category *</span>
            <select name="category" value={form.category} onChange={handleChange}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-group">
            <span className="label">Stock Quantity</span>
            <input className="input" name="stock" type="number" value={form.stock} onChange={handleChange} placeholder="10" />
          </div>
        </div>

        {/* Sizes */}
        <div className="form-group">
          <span className="label">Available Sizes</span>
          <div style={{ display: 'flex', gap: 8 }}>
            {ALL_SIZES.map((s) => (
              <motion.button
                key={s}
                type="button"
                className={`size-btn ${form.sizes.includes(s) ? 'active' : ''}`}
                onClick={() => toggleSize(s)}
                whileTap={{ scale: 0.95 }}
              >
                {s}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Colors */}
        <div className="form-group">
          <span className="label">Colors ({form.colors.length} selected)</span>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {PRESET_COLORS.map((c) => (
              <motion.div
                key={c.name}
                className={`color-dot ${form.colors.find(fc => fc.name === c.name) ? 'active' : ''}`}
                style={{ background: c.hex, border: c.hex === '#FFFFFF' ? '2px solid #ddd' : '2px solid transparent' }}
                onClick={() => toggleColor(c)}
                title={c.name}
                whileTap={{ scale: 0.9 }}
              />
            ))}
          </div>
          <div style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 8 }}>
            Selected: {form.colors.map(c => c.name).join(', ') || 'None'}
          </div>
        </div>

        {/* Badge */}
        <div className="form-group">
          <span className="label">Badge</span>
          <select name="badge" value={form.badge} onChange={handleChange}>
            <option value="">None</option>
            <option value="NEW">NEW</option>
            <option value="SALE">SALE</option>
          </select>
        </div>

        {/* Images */}
        <div className="form-group">
          <span className="label">Images ({form.images.length})</span>
          <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
          {uploading && <p style={{ fontSize: 12, color: 'var(--color-muted)', marginTop: 8 }}>Uploading...</p>}
          {form.images.length > 0 && (
            <div className="image-preview">
              {form.images.map((url, idx) => (
                <div key={idx} style={{ position: 'relative' }}>
                  <img src={url} alt="" />
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    style={{ position: 'absolute', top: 4, right: 4, background: 'var(--color-accent)', color: '#fff', border: 'none', borderRadius: '50%', width: 22, height: 22, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >×</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Publish & Feature */}
        <div className="form-group" style={{ display: 'flex', gap: 32, padding: '16px 0' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
            <input type="checkbox" name="is_published" checked={form.is_published} onChange={handleChange} />
            Published
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
            <input type="checkbox" name="is_featured" checked={form.is_featured} onChange={handleChange} />
            Featured on Homepage
          </label>
        </div>

        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ color: 'var(--color-accent)', fontSize: 13, marginBottom: 12 }}
          >
            {error}
          </motion.p>
        )}

        <div style={{ display: 'flex', gap: 12 }}>
          <motion.button
            className="btn-primary"
            type="submit"
            disabled={saving}
            whileTap={{ scale: 0.98 }}
            style={{ flex: 1 }}
          >
            {saving ? 'Saving...' : isEdit ? 'Update Product' : 'Create Product'}
          </motion.button>
          <button
            type="button"
            className="btn-outline"
            onClick={() => navigate('/admin/products')}
          >
            Cancel
          </button>
        </div>
      </form>
    </motion.div>
  );
}
