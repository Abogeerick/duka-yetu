import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../config/api';
import ProductCard from '../components/ProductCard';

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/products', { params: { featured: true, limit: 8 } })
      .then(({ data }) => setFeatured(data.products))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <div className="hero">
        <div className="hero-bg" />
        <div className="hero-content">
          <h1>Fashion That<br />Moves</h1>
          <p>Contemporary Women&apos;s Fashion — Nairobi</p>
          <Link to="/shop" className="btn-hero">Shop Collection</Link>
        </div>
      </div>

      <div className="section">
        <h2 className="section-title">Our Collection</h2>
        <div className="section-line" />
        {loading ? (
          <p className="empty-state">Loading...</p>
        ) : (
          <div className="product-grid">
            {featured.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
        <div className="text-center mt-4">
          <Link to="/shop" className="btn-outline">View All Products</Link>
        </div>
      </div>
    </>
  );
}
