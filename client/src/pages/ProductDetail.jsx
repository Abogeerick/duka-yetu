import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/products/${slug}`)
      .then(({ data }) => setProduct(data))
      .catch(() => navigate('/shop'))
      .finally(() => setLoading(false));
  }, [slug, navigate]);

  if (loading || !product) return <p className="empty-state">Loading...</p>;

  const colors = product.colors || [];

  return (
    <div>
      <button className="back-link" onClick={() => navigate(-1)}>← Back</button>
      <div className="detail-grid">
        <img src={product.images?.[0] || 'https://via.placeholder.com/600x800'} alt={product.name} />
        <div>
          <h1 className="detail-name">{product.name}</h1>
          <div className="detail-price">
            {product.compare_price && (
              <span className="old-price" style={{ fontSize: 18, marginRight: 12 }}>
                {formatKES(product.compare_price)}
              </span>
            )}
            {formatKES(product.price)}
          </div>
          <p className="detail-desc">{product.description}</p>

          <div>
            <span className="label">Size</span>
            <div className="size-options">
              {product.sizes?.map((s) => (
                <button
                  key={s}
                  className={`size-btn ${selectedSize === s ? 'active' : ''}`}
                  onClick={() => setSelectedSize(s)}
                >{s}</button>
              ))}
            </div>
          </div>

          {colors.length > 0 && (
            <div>
              <span className="label">Color</span>
              <div className="color-options">
                {colors.map((c) => (
                  <div
                    key={c.hex}
                    className={`color-dot ${selectedColor === c.name ? 'active' : ''}`}
                    style={{ background: c.hex }}
                    onClick={() => setSelectedColor(c.name)}
                    title={c.name}
                  />
                ))}
              </div>
            </div>
          )}

          <button
            className="btn-primary"
            style={{ marginTop: 24 }}
            disabled={!selectedSize || (colors.length > 0 && !selectedColor)}
            onClick={() => addItem(product, selectedSize, selectedColor || 'Default')}
          >
            Add to Cart — {formatKES(product.price)}
          </button>

          <div className="delivery-info">
            <div style={{ fontWeight: 600, marginBottom: 8, letterSpacing: 1 }}>DELIVERY INFO</div>
            <div>✓ Same-day delivery in Nairobi (orders before 5PM)</div>
            <div>✓ Pay on delivery — M-Pesa / Cash</div>
            <div>✓ Worldwide shipping available</div>
            <div>✓ Free returns within 7 days</div>
          </div>
        </div>
      </div>
    </div>
  );
}
