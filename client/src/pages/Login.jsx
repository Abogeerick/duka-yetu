import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', full_name: '', phone: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

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
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="checkout-page">
      <h2 className="section-title" style={{ textAlign: 'left', fontSize: 24, marginBottom: 32 }}>
        {isRegister ? 'Create Account' : 'Sign In'}
      </h2>

      <form onSubmit={handleSubmit}>
        {isRegister && (
          <>
            <input className="input" name="full_name" placeholder="Full Name" value={form.full_name} onChange={handleChange} />
            <input className="input" name="phone" placeholder="Phone Number" value={form.phone} onChange={handleChange} />
          </>
        )}
        <input className="input" name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} required />
        <input className="input" name="password" type="password" placeholder="Password" value={form.password} onChange={handleChange} required minLength={6} />

        {error && <p style={{ color: 'var(--color-accent)', fontSize: 13, marginBottom: 12 }}>{error}</p>}

        <button className="btn-primary" type="submit" disabled={loading}>
          {loading ? 'Please wait...' : isRegister ? 'Create Account' : 'Sign In'}
        </button>
      </form>

      <p style={{ marginTop: 24, fontSize: 13, textAlign: 'center', color: '#666' }}>
        {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
        <button
          onClick={() => { setIsRegister(!isRegister); setError(''); }}
          style={{ background: 'none', border: 'none', color: 'var(--color-text)', fontWeight: 600, textDecoration: 'underline' }}
        >
          {isRegister ? 'Sign In' : 'Register'}
        </button>
      </p>
    </div>
  );
}
