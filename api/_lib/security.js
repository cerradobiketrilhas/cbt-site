const RATE_LIMIT_STORE = new Map();

const DEFAULT_ALLOWED_ORIGINS = [
  'https://cerradobiketrilhas.com',
  'https://www.cerradobiketrilhas.com',
  'https://cbt-site.vercel.app'
];

export function getClientIp(req) {
  const xff = req.headers['x-forwarded-for'];
  if (typeof xff === 'string' && xff.trim()) {
    return xff.split(',')[0].trim();
  }
  if (Array.isArray(xff) && xff.length > 0) {
    return String(xff[0]).trim();
  }
  return (
    req.headers['x-real-ip'] ||
    req.socket?.remoteAddress ||
    'unknown'
  );
}

export function getAllowedOrigins(req) {
  const envOrigins = String(process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);

  const host = String(req.headers.host || '').trim();
  const protocol = process.env.VERCEL ? 'https' : 'http';
  const requestHostOrigin = host ? `${protocol}://${host}` : null;

  const origins = new Set([...DEFAULT_ALLOWED_ORIGINS, ...envOrigins]);
  if (requestHostOrigin) origins.add(requestHostOrigin);
  return origins;
}

export function applySecurityHeaders(req, res) {
  const origin = String(req.headers.origin || '').trim();
  const allowedOrigins = getAllowedOrigins(req);
  const originAllowed = origin && allowedOrigins.has(origin);

  if (originAllowed) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }

  // Browser hardening baseline for API responses.
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  return {
    originAllowed
  };
}

export function applyCorsPreflight(req, res, methods = 'GET, POST, OPTIONS') {
  const { originAllowed } = applySecurityHeaders(req, res);
  if (originAllowed) {
    res.setHeader('Access-Control-Allow-Methods', methods);
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-CSRF-Token');
    res.setHeader('Access-Control-Max-Age', '600');
  }
}

export function consumeRateLimit({
  key,
  maxRequests,
  windowMs,
  blockMs
}) {
  const now = Date.now();
  const entry = RATE_LIMIT_STORE.get(key);

  if (!entry || now > entry.windowEnd) {
    RATE_LIMIT_STORE.set(key, {
      count: 1,
      windowEnd: now + windowMs,
      blockedUntil: 0
    });
    return { allowed: true, remaining: maxRequests - 1, retryAfterSec: 0 };
  }

  if (entry.blockedUntil && now < entry.blockedUntil) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSec: Math.ceil((entry.blockedUntil - now) / 1000)
    };
  }

  entry.count += 1;
  if (entry.count > maxRequests) {
    entry.blockedUntil = now + blockMs;
    return {
      allowed: false,
      remaining: 0,
      retryAfterSec: Math.ceil(blockMs / 1000)
    };
  }

  return {
    allowed: true,
    remaining: Math.max(0, maxRequests - entry.count),
    retryAfterSec: 0
  };
}
