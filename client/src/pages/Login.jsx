import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', full_name: '', phone: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegister) {
        await register(form.email, form.password, form.full_name, form.phone);
      } else {
        await login(form.email, form.password);
      }
      navigate(redirect);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      className="auth-page"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="auth-card">
        <motion.div
          key={isRegister ? 'register' : 'login'}
          initial={{ opacity: 0, x: isRegister ? 20 : -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h2>{isRegister ? 'Create Account' : 'Welcome Back'}</h2>
          <p className="subtitle">
            {isRegister
              ? 'Join Duka Yetu for exclusive offers and faster checkout'
              : 'Sign in to your account to continue'}
          </p>

          <form onSubmit={handleSubmit}>
            {isRegister && (
              <>
                <input
                  className="input"
                  name="full_name"
                  placeholder="Full Name"
                  value={form.full_name}
                  onChange={handleChange}
                />
                <input
                  className="input"
                  name="phone"
                  placeholder="Phone Number (07XXXXXXXX)"
                  value={form.phone}
                  onChange={handleChange}
                />
              </>
            )}

            <input
              className="input"
              name="email"
              type="email"
              placeholder="Email Address"
              value={form.email}
              onChange={handleChange}
              required
            />
            <input
              className="input"
              name="password"
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              required
              minLength={6}
            />

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ color: 'var(--color-accent)', fontSize: 13, marginBottom: 12 }}
              >
                {error}
              </motion.p>
            )}

            <motion.button
              className="btn-primary"
              type="submit"
              disabled={loading}
              whileTap={{ scale: 0.98 }}
              style={{ marginTop: 8 }}
            >
              {loading ? 'Please wait...' : isRegister ? 'Create Account' : 'Sign In'}
            </motion.button>
          </form>

          <div className="auth-divider">or</div>

          <p style={{ fontSize: 13, textAlign: 'center', color: 'var(--color-muted)' }}>
            {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              onClick={() => { setIsRegister(!isRegister); setError(''); }}
              style={{ background: 'none', border: 'none', color: 'var(--color-text)', fontWeight: 600, textDecoration: 'underline', cursor: 'pointer' }}
            >
              {isRegister ? 'Sign In' : 'Create One'}
            </button>
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}
