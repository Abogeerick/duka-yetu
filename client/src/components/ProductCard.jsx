import { Link } from 'react-router-dom';

const formatKES = (n) => `KSh ${n.toLocaleString()}`;

export default function ProductCard({ product }) {
  return (
    <Link to={`/product/${product.slug}`} className="product-card">
      {product.badge && (
        <span className={`card-badge ${product.badge.toLowerCase()}`}>{product.badge}</span>
      )}
      <img src={product.images?.[0] || 'https://via.placeholder.com/400x533'} alt={product.name} />
      <div className="body">
        <div className="name">{product.name}</div>
        <div className="price">
          {product.compare_price && <span className="old-price">{formatKES(product.compare_price)}</span>}
          {formatKES(product.price)}
        </div>
      </div>
    </Link>
  );
}
