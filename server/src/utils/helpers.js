/**
 * Generate a unique order number: DY-YYYYMMDD-XXX
 */
export function generateOrderNumber() {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.floor(Math.random() * 900 + 100);
  return `DY-${date}-${rand}`;
}

/**
 * Format phone number to 254XXXXXXXXX
 * Accepts: 0712345678, +254712345678, 254712345678, 712345678
 */
export function formatPhone(phone) {
  let cleaned = phone.replace(/[\s+\-()]/g, '');

  if (cleaned.startsWith('0')) {
    cleaned = '254' + cleaned.slice(1);
  } else if (cleaned.startsWith('7') || cleaned.startsWith('1')) {
    cleaned = '254' + cleaned;
  } else if (cleaned.startsWith('+254')) {
    cleaned = cleaned.slice(1);
  }

  if (!/^254\d{9}$/.test(cleaned)) {
    throw new Error('Invalid phone number format. Use 07XXXXXXXX or 254XXXXXXXXX');
  }

  return cleaned;
}

/**
 * Generate URL-friendly slug from text
 */
export function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
