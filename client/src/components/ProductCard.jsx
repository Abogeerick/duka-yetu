import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const formatKES = (n) => `KSh ${n.toLocaleString()}`;

export default function ProductCard({ product, index = 0 }) {
  const images = product.images || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, delay: index * 0.08, ease: 'easeOut' }}
    >
      <Link to={`/product/${product.slug}`} className="product-card">
        {product.badge && (
          <span className={`card-badge ${product.badge.toLowerCase()}`}>{product.badge}</span>
        )}

        <div className="img-wrapper">
          <img
            src={images[0] || 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400'}
            alt={product.name}
            loading="lazy"
          />
          {images[1] && (
            <img
              src={images[1]}
              alt={`${product.name} alternate`}
              className="hover-img"
              loading="lazy"
            />
          )}
          <div className="quick-actions">
            <span className="quick-add-btn">View Details</span>
          </div>
        </div>

        <div className="body">
          <div className="name">{product.name}</div>
          <div className="price">
            {product.compare_price && (
              <span className="old-price">{formatKES(product.compare_price)}</span>
            )}
            {formatKES(product.price)}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
