import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import api from '../config/api';

const formatKES = (n) => `KSh ${n.toLocaleString()}`;

export default function Account() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) { navigate('/login?redirect=/account'); return; }
        api.get('/orders/my-orders')
            .then(({ data }) => setOrders(data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [user, navigate]);

    if (!user) return null;

    return (
        <motion.div
            className="account-page"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
                <div>
                    <h2 className="section-title" style={{ textAlign: 'left', marginBottom: 4, fontSize: 28 }}>
                        My Account
                    </h2>
                    <p style={{ color: 'var(--color-muted)', fontSize: 13 }}>
                        Welcome back, {user?.profile?.full_name || user?.email}
                    </p>
                </div>
                <button className="btn-outline" onClick={() => { logout(); navigate('/'); }}>
                    Sign Out
                </button>
            </div>

            {/* Profile Card */}
            <motion.div
                className="checkout-section"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                style={{ marginBottom: 32 }}
            >
                <span className="label">Profile</span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, fontSize: 14 }}>
                    <div>
                        <div style={{ color: 'var(--color-muted)', fontSize: 12, marginBottom: 4 }}>Name</div>
                        <div style={{ fontWeight: 500 }}>{user?.profile?.full_name || '—'}</div>
                    </div>
                    <div>
                        <div style={{ color: 'var(--color-muted)', fontSize: 12, marginBottom: 4 }}>Email</div>
                        <div style={{ fontWeight: 500 }}>{user?.email || '—'}</div>
                    </div>
                    <div>
                        <div style={{ color: 'var(--color-muted)', fontSize: 12, marginBottom: 4 }}>Phone</div>
                        <div style={{ fontWeight: 500 }}>{user?.profile?.phone || '—'}</div>
                    </div>
                    <div>
                        <div style={{ color: 'var(--color-muted)', fontSize: 12, marginBottom: 4 }}>City</div>
                        <div style={{ fontWeight: 500 }}>{user?.profile?.city || 'Nairobi'}</div>
                    </div>
                </div>
            </motion.div>

            {/* Orders */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <h3 style={{ fontSize: 14, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 20, fontWeight: 600 }}>
                    Order History ({orders.length})
                </h3>

                {loading ? (
                    <div>
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="skeleton" style={{ height: 100, marginBottom: 12, borderRadius: 8 }} />
                        ))}
                    </div>
                ) : orders.length === 0 ? (
                    <div className="empty-state">
                        <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.3 }}>📦</div>
                        <p>No orders yet</p>
                        <div className="mt-2">
                            <Link to="/shop" className="btn-outline">Start Shopping</Link>
                        </div>
                    </div>
                ) : (
                    orders.map((order, i) => (
                        <motion.div
                            key={order.id}
                            className="order-card"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 * i }}
                        >
                            <div className="order-card-header">
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{order.order_number}</div>
                                    <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>
                                        {new Date(order.created_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' })}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <span className={`status-badge ${order.status}`}>{order.status}</span>
                                    <span style={{ fontWeight: 600 }}>{formatKES(order.total)}</span>
                                </div>
                            </div>
                            <div className="order-items-preview">
                                {order.order_items?.map((item) => (
                                    <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        {item.product_image && <img src={item.product_image} alt="" />}
                                        <div style={{ fontSize: 12 }}>
                                            <div style={{ fontWeight: 500 }}>{item.product_name}</div>
                                            <div style={{ color: 'var(--color-muted)' }}>{item.size} × {item.quantity}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    ))
                )}
            </motion.div>
        </motion.div>
    );
}
