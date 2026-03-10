import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../config/api';
import ProductCard from '../components/ProductCard';

const CATEGORIES = [
  { name: 'Dresses', path: '/shop/dresses', image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&q=80' },
  { name: 'Gowns', path: '/shop/gowns', image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600&q=80' },
  { name: 'Two Piece', path: '/shop/two-piece', image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600&q=80' },
];

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/products', { params: { featured: true, limit: 8 } }),
      api.get('/products', { params: { badge: 'NEW', limit: 4 } }),
    ])
      .then(([featuredRes, newRes]) => {
        setFeatured(featuredRes.data.products);
        setNewArrivals(newRes.data.products);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      {/* ── Hero Section — Full Screen Runway ── */}
      <div className="hero">
        <motion.div
          className="hero-bg"
          style={{ backgroundImage: 'url(/images/hero-runway.png)' }}
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 2, ease: 'easeOut' }}
        />
        <div className="hero-overlay" />
        <div className="hero-content">
          <motion.p
            className="hero-subtitle"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            Contemporary African Fashion
          </motion.p>
          <motion.div
            className="hero-brand"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.5 }}
          >
            Akin Styles
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            Where Elegance<br />Meets <em>Culture</em>
          </motion.h1>
          <motion.div
            className="hero-cta-group"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.1 }}
          >
            <Link to="/shop" className="btn-hero-fill">Shop Collection</Link>
            <Link to="/shop/gowns" className="btn-hero">View Gowns</Link>
          </motion.div>
        </div>
      </div>

      {/* ── Promo Marquee ── */}
      <div className="promo-banner">
        <div className="promo-track">
          {[...Array(2)].map((_, i) => (
            <span key={i}>
              Free Nairobi Delivery&nbsp;&nbsp;✦&nbsp;&nbsp;
              M-Pesa Payments&nbsp;&nbsp;✦&nbsp;&nbsp;
              7 Day Returns&nbsp;&nbsp;✦&nbsp;&nbsp;
              Same Day Dispatch&nbsp;&nbsp;✦&nbsp;&nbsp;
              Handpicked Collections&nbsp;&nbsp;✦&nbsp;&nbsp;
              Free Nairobi Delivery&nbsp;&nbsp;✦&nbsp;&nbsp;
              M-Pesa Payments&nbsp;&nbsp;✦&nbsp;&nbsp;
              7 Day Returns&nbsp;&nbsp;✦&nbsp;&nbsp;
            </span>
          ))}
        </div>
      </div>

      {/* ── Split Hero — Editorial Shot ── */}
      <div className="hero-split">
        <motion.div
          className="hero-split-img"
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <img src="/images/hero-editorial.png" alt="Akin Styles editorial" />
        </motion.div>
        <motion.div
          className="hero-split-content"
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.1 }}
        >
          <p className="hero-subtitle" style={{ color: 'var(--color-gold)', textAlign: 'left', marginBottom: 16 }}>
            New Season
          </p>
          <h2>Made for the Modern African Woman</h2>
          <p>
            Every piece in our collection is carefully curated to celebrate confidence,
            culture, and contemporary style. From Nairobi runways to your wardrobe.
          </p>
          <Link to="/shop" className="btn-outline" style={{ alignSelf: 'flex-start' }}>
            Explore Collection
          </Link>
        </motion.div>
      </div>

      {/* ── Featured Collection ── */}
      <div className="section">
        <motion.h2
          className="section-title"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          Our Collection
        </motion.h2>
        <motion.div
          className="section-line"
          initial={{ width: 0 }}
          whileInView={{ width: 48 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        />

        {loading ? (
          <div className="product-grid">
            {[...Array(4)].map((_, i) => (
              <div key={i}>
                <div className="skeleton" style={{ aspectRatio: '3/4', marginBottom: 12 }} />
                <div className="skeleton" style={{ height: 16, width: '70%', marginBottom: 8 }} />
                <div className="skeleton" style={{ height: 14, width: '40%' }} />
              </div>
            ))}
          </div>
        ) : (
          <div className="product-grid">
            {featured.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        )}

        <motion.div
          className="text-center mt-4"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
        >
          <Link to="/shop" className="btn-outline">View All Products</Link>
        </motion.div>
      </div>

      {/* ── Category Banners ── */}
      <div className="category-grid" style={{ marginBottom: 80 }}>
        {CATEGORIES.map((cat, i) => (
          <motion.div
            key={cat.name}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: i * 0.15 }}
          >
            <Link to={cat.path} className="category-card">
              <img src={cat.image} alt={cat.name} loading="lazy" />
              <div className="overlay">
                <h3>{cat.name}</h3>
                <span>Shop Now →</span>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* ── New Arrivals ── */}
      {newArrivals.length > 0 && (
        <div className="section" style={{ paddingTop: 0 }}>
          <motion.h2
            className="section-title"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            New Arrivals
          </motion.h2>
          <motion.div
            className="section-line"
            initial={{ width: 0 }}
            whileInView={{ width: 48 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          />
          <div className="product-grid">
            {newArrivals.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        </div>
      )}
    </>
  );
}
