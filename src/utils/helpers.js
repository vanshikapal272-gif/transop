/**
 * Format currency value (INR by default)
 */
export function formatCurrency(value, currency = 'INR') {
  if (value == null || isNaN(value)) return '—';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Format a date string to readable format
 */
export function formatDate(dateStr, options = {}) {
  if (!dateStr) return '—';
  const defaults = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(dateStr).toLocaleDateString('en-IN', { ...defaults, ...options });
}

/**
 * Format date + time
 */
export function formatDateTime(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format percentage
 */
export function formatPercentage(value, decimals = 1) {
  if (value == null || isNaN(value)) return '—';
  return `${Number(value).toFixed(decimals)}%`;
}

/**
 * Format large numbers with K/M suffix
 */
export function formatCompact(value) {
  if (value == null || isNaN(value)) return '—';
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toString();
}

/**
 * Get relative time (e.g. "2 hours ago")
 */
export function timeAgo(dateStr) {
  if (!dateStr) return '';
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  const intervals = [
    { label: 'year', seconds: 31536000 },
    { label: 'month', seconds: 2592000 },
    { label: 'week', seconds: 604800 },
    { label: 'day', seconds: 86400 },
    { label: 'hour', seconds: 3600 },
    { label: 'minute', seconds: 60 },
  ];
  for (const { label, seconds: s } of intervals) {
    const count = Math.floor(seconds / s);
    if (count >= 1) return `${count} ${label}${count > 1 ? 's' : ''} ago`;
  }
  return 'Just now';
}

/**
 * Capitalize first letter
 */
export function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Get initials from a name
 */
export function getInitials(name) {
  if (!name) return '';
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Status to badge variant mapping
 */
export function getStatusVariant(status) {
  const map = {
    active: 'success',
    running: 'success',
    completed: 'success',
    operational: 'success',
    available: 'success',
    paid: 'success',
    approved: 'success',
    inactive: 'neutral',
    idle: 'neutral',
    pending: 'warning',
    scheduled: 'warning',
    'in-progress': 'info',
    'in_progress': 'info',
    'on-trip': 'info',
    maintenance: 'warning',
    'under-maintenance': 'warning',
    overdue: 'error',
    expired: 'error',
    cancelled: 'error',
    breakdown: 'error',
    suspended: 'error',
    rejected: 'error',
  };
  return map[status?.toLowerCase()] || 'neutral';
}

/**
 * Debounce
 */
export function debounce(fn, delay = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Generate a random ID
 */
export function generateId() {
  return Math.random().toString(36).slice(2, 11);
}
