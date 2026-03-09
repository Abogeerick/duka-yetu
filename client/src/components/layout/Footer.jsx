import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function Footer() {
  return (
    <>
      {/* Newsletter Section */}
      <div className="newsletter">
        <motion.h3
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          Stay in The Loop
        </motion.h3>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          Subscribe for new arrivals, exclusive offers, and style inspiration
        </motion.p>
        <motion.div
          className="newsletter-form"
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <input placeholder="Enter your email address" type="email" />
          <button type="button">Subscribe</button>
        </motion.div>
      </div>

      <footer className="footer">
        <div className="footer-grid">
          <div className="footer-brand">
            <div className="logo-footer">Duka Yetu</div>
            <p>
              Contemporary women&apos;s fashion, handpicked for the modern Kenyan woman.
              Nairobi-based, shipping nationwide and worldwide.
            </p>
          </div>

          <div>
            <div className="footer-title">Shop</div>
            <Link to="/shop" className="footer-link">All Products</Link>
            <Link to="/shop/dresses" className="footer-link">Dresses</Link>
            <Link to="/shop/maxi" className="footer-link">Maxi</Link>
            <Link to="/shop/mini" className="footer-link">Mini</Link>
            <Link to="/shop/gowns" className="footer-link">Gowns</Link>
            <Link to="/shop/two-piece" className="footer-link">Two Piece</Link>
            <Link to="/shop/jumpsuits" className="footer-link">Jumpsuits</Link>
          </div>

          <div>
            <div className="footer-title">Help</div>
            <span className="footer-link">Size Guide</span>
            <span className="footer-link">Shipping Info</span>
            <span className="footer-link">Returns & Exchanges</span>
            <span className="footer-link">Track Order</span>
            <span className="footer-link">FAQs</span>
          </div>

          <div>
            <div className="footer-title">Contact Us</div>
            <span className="footer-link">Mon–Fri 11am–7pm</span>
            <span className="footer-link">Sat 11am–2pm</span>
            <span className="footer-link">+254 7XX XXX XXX</span>
            <span className="footer-link">hello@dukayetu.co.ke</span>
            <div style={{ display: 'flex', gap: 16, marginTop: 16 }}>
              <a href="#" className="footer-link" style={{ marginBottom: 0 }}>Instagram</a>
              <a href="#" className="footer-link" style={{ marginBottom: 0 }}>TikTok</a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          © {new Date().getFullYear()} Duka Yetu. All rights reserved.&nbsp;•&nbsp;Powered by M-Pesa
        </div>
      </footer>
    </>
  );
}
