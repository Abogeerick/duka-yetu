import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../config/api';
import { useCart } from '../context/CartContext';

const formatKES = (n) => `KSh ${n.toLocaleString()}`;

export default function ProductDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const [product, setProduct] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.get(`/products/${slug}`)
      .then(({ data }) => {
        setProduct(data);
        if (data.colors?.length === 1) setSelectedColor(data.colors[0].name);
      })
      .catch(() => navigate('/shop'))
      .finally(() => setLoading(false));
  }, [slug, navigate]);

  const handleAdd = () => {
    addItem(product, selectedSize, selectedColor || 'Default');
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  if (loading || !product) {
    return (
      <div className="detail-container">
        <div className="detail-grid">
          <div className="skeleton" style={{ aspectRatio: '3/4' }} />
          <div>
            <div className="skeleton" style={{ height: 24, width: '60%', marginBottom: 16 }} />
            <div className="skeleton" style={{ height: 18, width: '30%', marginBottom: 32 }} />
            <div className="skeleton" style={{ height: 80, marginBottom: 24 }} />
            <div className="skeleton" style={{ height: 48, marginBottom: 16 }} />
            <div className="skeleton" style={{ height: 52 }} />
          </div>
        </div>
      </div>
    );
  }

  const colors = product.colors || [];
  const images = product.images || [];
  const savings = product.compare_price ? product.compare_price - product.price : 0;

  return (
    <motion.div
      className="detail-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className="breadcrumb">
        <Link to="/">Home</Link>
        <span>/</span>
        <Link to="/shop">Shop</Link>
        <span>/</span>
        <Link to={`/shop/${product.category}`}>{product.category}</Link>
        <span>/</span>
        <span style={{ color: 'var(--color-text)' }}>{product.name}</span>
      </div>

      <div className="detail-grid">
        {/* Images */}
        <motion.div
          className="detail-images"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <AnimatePresence mode="wait">
            <motion.img
              key={selectedImage}
              src={images[selectedImage] || 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600'}
              alt={product.name}
              className="main-img"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            />
          </AnimatePresence>
          {images.length > 1 && (
            <div className="detail-thumbnails">
              {images.map((img, i) => (
                <img
                  key={i}
                  src={img}
                  alt=""
                  className={i === selectedImage ? 'active' : ''}
                  onClick={() => setSelectedImage(i)}
                />
              ))}
            </div>
          )}
        </motion.div>

        {/* Info */}
        <motion.div
          className="detail-info"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <h1 className="detail-name">{product.name}</h1>

          <div className="detail-price">
            {product.compare_price && (
              <span className="old-price">{formatKES(product.compare_price)}</span>
            )}
            {formatKES(product.price)}
            {savings > 0 && (
              <span className="save-badge">Save {formatKES(savings)}</span>
            )}
          </div>

          <p className="detail-desc">{product.description}</p>

          {/* Size selector */}
          <div>
            <span className="option-label">Size {selectedSize && `— ${selectedSize}`}</span>
            <div className="size-options">
              {product.sizes?.map((s) => (
                <motion.button
                  key={s}
                  className={`size-btn ${selectedSize === s ? 'active' : ''}`}
                  onClick={() => setSelectedSize(s)}
                  whileTap={{ scale: 0.95 }}
                >
                  {s}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Color selector */}
          {colors.length > 0 && (
            <div>
              <span className="option-label">Color {selectedColor && `— ${selectedColor}`}</span>
              <div className="color-options">
                {colors.map((c) => (
                  <motion.div
                    key={c.hex}
                    className={`color-dot ${selectedColor === c.name ? 'active' : ''}`}
                    style={{ background: c.hex }}
                    onClick={() => setSelectedColor(c.name)}
                    title={c.name}
                    whileTap={{ scale: 0.9 }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Add to Cart */}
          <motion.button
            className="btn-primary"
            style={{ marginTop: 16 }}
            disabled={!selectedSize || (colors.length > 0 && !selectedColor)}
            onClick={handleAdd}
            whileTap={{ scale: 0.98 }}
          >
            {added ? '✓ Added to Cart!' : `Add to Cart — ${formatKES(product.price)}`}
          </motion.button>

          {/* Delivery info */}
          <div className="delivery-info">
            <div style={{ fontWeight: 600, marginBottom: 12, letterSpacing: 2, fontSize: 11, textTransform: 'uppercase' }}>
              Delivery & Returns
            </div>
            <div>✓ Same-day delivery in Nairobi (orders before 5PM)</div>
            <div>✓ Pay on delivery — M-Pesa / Cash</div>
            <div>✓ Nationwide shipping available</div>
            <div>✓ Free returns within 7 days</div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
