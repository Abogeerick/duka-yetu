import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-grid">
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, letterSpacing: 4, marginBottom: 16 }}>
            DUKA YETU
          </div>
          <p style={{ color: '#999', fontSize: 13, lineHeight: 1.8 }}>
            Contemporary women&apos;s fashion. Nairobi-based, shipping worldwide.
          </p>
        </div>
        <div>
          <div className="footer-title">Shop</div>
          <Link to="/shop/dresses" className="footer-link">Dresses</Link>
          <Link to="/shop/maxi" className="footer-link">Maxi</Link>
          <Link to="/shop/mini" className="footer-link">Mini</Link>
          <Link to="/shop/gowns" className="footer-link">Gowns</Link>
          <Link to="/shop/jumpsuits" className="footer-link">Jumpsuits</Link>
        </div>
        <div>
          <div className="footer-title">Help</div>
          <span className="footer-link">Size Guide</span>
          <span className="footer-link">Shipping Info</span>
          <span className="footer-link">Returns &amp; Exchanges</span>
          <span className="footer-link">Track Order</span>
          <span className="footer-link">FAQs</span>
        </div>
        <div>
          <div className="footer-title">Contact</div>
          <span className="footer-link">Mon–Fri 11am–7pm</span>
          <span className="footer-link">Sat 11am–2pm</span>
          <span className="footer-link">+254 7XX XXX XXX</span>
          <span className="footer-link">hello@dukayetu.co.ke</span>
        </div>
      </div>
      <div className="footer-bottom">
        © {new Date().getFullYear()} Duka Yetu. All rights reserved.&nbsp;•&nbsp;Powered by M-Pesa
      </div>
    </footer>
  );
}
