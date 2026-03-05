import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../config/api';
import ProductCard from '../components/ProductCard';

const CATEGORIES = ['all', 'dresses', 'maxi', 'mini', 'gowns', 'two-piece', 'jumpsuits'];

export default function Shop() {
  const { category } = useParams();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const activeCat = category || 'all';

  useEffect(() => {
    setLoading(true);
    const params = {};
    if (activeCat !== 'all') params.category = activeCat;
    if (search) params.search = search;

    api.get('/products', { params })
      .then(({ data }) => setProducts(data.products))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [activeCat, search]);

  return (
    <>
      <nav className="cat-nav">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            className={activeCat === cat ? 'active' : ''}
            onClick={() => navigate(cat === 'all' ? '/shop' : `/shop/${cat}`)}
          >
            {cat.replace('-', ' ')}
          </button>
        ))}
      </nav>

      <div className="section">
        <div style={{ marginBottom: 32 }}>
          <input
            className="input"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ maxWidth: 400, margin: '0 auto', display: 'block' }}
          />
        </div>

        <h2 className="section-title">
          {activeCat === 'all' ? 'All Products' : activeCat.replace('-', ' ')}
        </h2>
        <div className="section-line" />

        {loading ? (
          <p className="empty-state">Loading...</p>
        ) : products.length === 0 ? (
          <p className="empty-state">No products found</p>
        ) : (
          <div className="product-grid">
            {products.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </div>
    </>
  );
}
