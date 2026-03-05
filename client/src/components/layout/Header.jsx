import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';

export default function Header() {
  const { count } = useCart();
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <>
      <div className="top-bar">
        Worldwide Shipping&nbsp;•&nbsp;Pay on Delivery (Nairobi)&nbsp;•&nbsp;M-Pesa / Visa / PayPal
      </div>
      <header className="header">
        <Link to="/" className="logo">Duka Yetu</Link>
        <div className="header-actions">
          {isAdmin && (
            <Link to="/admin" className="btn-outline" style={{ padding: '6px 16px', fontSize: '10px' }}>
              Admin
            </Link>
          )}
          {user ? (
            <button className="icon-btn" onClick={logout} title="Logout" style={{ fontSize: '12px', letterSpacing: '1px' }}>
              Logout
            </button>
          ) : (
            <Link to="/login" className="icon-btn" title="Login">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </Link>
          )}
          <button className="icon-btn" onClick={() => navigate('/cart')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="2">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 01-8 0" />
            </svg>
            {count > 0 && <span className="cart-badge">{count}</span>}
          </button>
        </div>
      </header>
    </>
  );
}
