import { supabase, supabaseAdmin } from '../config/supabase.js';

/**
 * Verify JWT from Authorization header and attach user to request
 */
export async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing authorization token' });
  }

  const token = authHeader.split(' ')[1];

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  // Fetch profile with role
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  req.user = { ...user, profile };
  next();
}

/**
 * Require admin role
 */
export async function requireAdmin(req, res, next) {
  await requireAuth(req, res, () => {
    if (req.user?.profile?.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  });
}
