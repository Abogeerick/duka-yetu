import { Router } from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { requireAdmin } from '../middleware/auth.js';
import { slugify } from '../utils/helpers.js';

const router = Router();

// GET /api/products — Public: list published products
router.get('/', async (req, res) => {
  try {
    const { category, search, featured, badge, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('products')
      .select('*', { count: 'exact' })
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (category) query = query.eq('category', category);
    if (featured === 'true') query = query.eq('is_featured', true);
    if (badge) query = query.eq('badge', badge);
    if (search) query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);

    const { data, error, count } = await query;
    if (error) throw error;

    res.json({
      products: data,
      total: count,
      page: Number(page),
      totalPages: Math.ceil(count / limit),
    });
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// GET /api/products/:slug — Public: single product
router.get('/:slug', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('products')
      .select('*')
      .eq('slug', req.params.slug)
      .eq('is_published', true)
      .single();

    if (error || !data) return res.status(404).json({ error: 'Product not found' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// ── Admin Routes ──

// GET /api/products/admin/all — Admin: list all products
router.get('/admin/all', requireAdmin, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// POST /api/products — Admin: create product
router.post('/', requireAdmin, async (req, res) => {
  try {
    const { name, description, price, compare_price, category, sizes, colors, images, stock, is_published, is_featured, badge } = req.body;

    if (!name || !price || !category) {
      return res.status(400).json({ error: 'Name, price, and category are required' });
    }

    const slug = slugify(name) + '-' + Date.now().toString(36);

    const { data, error } = await supabaseAdmin
      .from('products')
      .insert({
        name, slug, description, price, compare_price, category,
        sizes: sizes || [],
        colors: colors || [],
        images: images || [],
        stock: stock || 0,
        is_published: is_published || false,
        is_featured: is_featured || false,
        badge: badge || null,
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    console.error('Error creating product:', err);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// PUT /api/products/:id — Admin: update product
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('products')
      .update(req.body)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// DELETE /api/products/:id — Admin: delete product
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const { error } = await supabaseAdmin
      .from('products')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

export default router;
