import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
    const params = { limit: 50 };
    if (activeCat !== 'all') params.category = activeCat;
    if (search) params.search = search;

    api.get('/products', { params })
      .then(({ data }) => setProducts(data.products))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [activeCat, search]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
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
        <div style={{ marginBottom: 40, maxWidth: 440, margin: '0 auto 40px' }}>
          <input
            className="input"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ textAlign: 'center' }}
          />
        </div>

        <motion.h2
          className="section-title"
          key={activeCat}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {activeCat === 'all' ? 'All Products' : activeCat.replace('-', ' ')}
        </motion.h2>
        <div className="section-line" />

        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              className="product-grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {[...Array(8)].map((_, i) => (
                <div key={i}>
                  <div className="skeleton" style={{ aspectRatio: '3/4', marginBottom: 12 }} />
                  <div className="skeleton" style={{ height: 16, width: '70%', marginBottom: 8 }} />
                  <div className="skeleton" style={{ height: 14, width: '40%' }} />
                </div>
              ))}
            </motion.div>
          ) : products.length === 0 ? (
            <motion.p
              key="empty"
              className="empty-state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              No products found
            </motion.p>
          ) : (
            <motion.div
              key={activeCat + search}
              className="product-grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {products.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
