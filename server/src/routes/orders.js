import { Router } from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { generateOrderNumber, formatPhone } from '../utils/helpers.js';

const router = Router();

// POST /api/orders — Public: create order (guest + logged-in)
router.post('/', async (req, res) => {
  try {
    const { customer_name, customer_phone, customer_email, delivery_address, delivery_city, items, payment_method, notes } = req.body;

    if (!customer_name || !customer_phone || !delivery_address || !items?.length) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const formattedPhone = formatPhone(customer_phone);
    const subtotal = items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
    const deliveryFee = delivery_city?.toLowerCase() === 'nairobi' ? 300 : 500;
    const total = subtotal + deliveryFee;

    // Create order
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        order_number: generateOrderNumber(),
        customer_name,
        customer_phone: formattedPhone,
        customer_email,
        delivery_address,
        delivery_city: delivery_city || 'Nairobi',
        subtotal,
        delivery_fee: deliveryFee,
        total,
        payment_method: payment_method || 'mpesa',
        notes,
        status: 'pending',
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // Create order items
    const orderItems = items.map((item) => ({
      order_id: order.id,
      product_id: item.product_id,
      product_name: item.product_name,
      product_image: item.product_image,
      size: item.size,
      color: item.color,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.unit_price * item.quantity,
    }));

    const { error: itemsError } = await supabaseAdmin
      .from('order_items')
      .insert(orderItems);

    if (itemsError) throw itemsError;

    // Decrement stock (non-blocking — don't fail the order if this errors)
    for (const item of items) {
      try {
        const { data: product } = await supabaseAdmin
          .from('products')
          .select('stock')
          .eq('id', item.product_id)
          .single();

        if (product) {
          await supabaseAdmin
            .from('products')
            .update({ stock: Math.max(0, product.stock - item.quantity) })
            .eq('id', item.product_id);
        }
      } catch (stockErr) {
        console.warn('Stock update failed (non-blocking):', stockErr.message);
      }
    }

    res.status(201).json(order);
  } catch (err) {
    console.error('Error creating order:', err);
    res.status(500).json({ error: err.message || 'Failed to create order' });
  }
});

// GET /api/orders/my-orders — Auth: customer's orders
router.get('/my-orders', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('orders')
      .select('*, order_items(*)')
      .eq('customer_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// GET /api/orders/:id — Public: get order by ID (for tracking)
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('orders')
      .select('*, order_items(*), payments(*)')
      .eq('id', req.params.id)
      .single();

    if (error || !data) return res.status(404).json({ error: 'Order not found' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// ── Admin Routes ──

// GET /api/orders/admin/all — Admin: all orders
router.get('/admin/all', requireAdmin, async (req, res) => {
  try {
    const { status } = req.query;
    let query = supabaseAdmin
      .from('orders')
      .select('*, order_items(*), payments(*)')
      .order('created_at', { ascending: false });

    if (status) query = query.eq('status', status);

    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// PUT /api/orders/admin/:id — Admin: update order status
router.put('/admin/:id', requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const { data, error } = await supabaseAdmin
      .from('orders')
      .update({ status })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update order' });
  }
});

// GET /api/orders/admin/stats — Admin: dashboard stats
router.get('/admin/stats', requireAdmin, async (_req, res) => {
  try {
    const { data: orders } = await supabaseAdmin.from('orders').select('total, status, created_at');

    const stats = {
      totalOrders: orders.length,
      totalRevenue: orders.filter(o => o.status === 'paid' || o.status === 'delivered').reduce((s, o) => s + o.total, 0),
      pendingOrders: orders.filter(o => o.status === 'pending').length,
      deliveredOrders: orders.filter(o => o.status === 'delivered').length,
    };

    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

export default router;
