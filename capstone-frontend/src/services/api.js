import axios from 'axios';

// ── Simple GET response cache (TTL-based) ───────────────
const cache = new Map();
const CACHE_TTL = 30_000; // 30 seconds

function getCacheKey(config) {
  if (config.method !== 'get') return null;
  const params = config.params ? JSON.stringify(config.params) : '';
  return `${config.url}|${params}`;
}

function getCached(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache(key, data) {
  cache.set(key, { data, ts: Date.now() });
}

// ── Request deduplication ───────────────────────────────
const pendingRequests = new Map();

// ── Axios instance ──────────────────────────────────────
const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  timeout: 20_000, // 20s timeout to prevent hanging
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor — attach token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('procureseal_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — cache + retry + 401
api.interceptors.response.use(
  (response) => {
    // Cache successful GET responses
    const key = getCacheKey(response.config);
    if (key) {
      setCache(key, response);
      pendingRequests.delete(key);
    }
    return response;
  },
  async (error) => {
    const config = error.config || {};
    const key = getCacheKey(config);
    if (key) pendingRequests.delete(key);

    // Auto-retry on network errors or 429/5xx (max 2 retries)
    const retryCount = config._retryCount || 0;
    const status = error.response?.status;
    const isRetryable = !status || status === 429 || status >= 500;

    if (isRetryable && retryCount < 2 && config.method === 'get') {
      config._retryCount = retryCount + 1;
      const delay = (retryCount + 1) * 800; // 800ms, 1600ms
      await new Promise((r) => setTimeout(r, delay));
      return api(config);
    }

    // Handle 401 — only redirect for genuine auth failures
    // Skip redirect for auth-check calls (AuthContext handles those gracefully)
    const isAuthCheck = config.url?.includes('/auth/login') || config.url?.includes('/auth/me');
    if (status === 401 && !isAuthCheck) {
      localStorage.removeItem('procureseal_token');
      localStorage.removeItem('procureseal_user');
      // Redirect to public transparency page, not login
      const publicPaths = ['/transparency', '/login'];
      if (!publicPaths.some(p => window.location.pathname.startsWith(p))) {
        window.location.href = '/transparency';
      }
    }

    return Promise.reject(error);
  }
);

// ── Wrapped GET with dedup + cache ──────────────────────
const originalGet = api.get.bind(api);
api.get = function cachedGet(url, config) {
  const cacheKey = getCacheKey({ method: 'get', url, params: config?.params });

  if (cacheKey) {
    // Return cached if fresh
    const cached = getCached(cacheKey);
    if (cached) return Promise.resolve(cached);

    // Deduplicate in-flight requests
    if (pendingRequests.has(cacheKey)) {
      return pendingRequests.get(cacheKey);
    }

    const promise = originalGet(url, config).catch((err) => {
      pendingRequests.delete(cacheKey);
      throw err;
    });

    pendingRequests.set(cacheKey, promise);
    return promise;
  }

  return originalGet(url, config);
};

/** Invalidate cache for a specific URL pattern */
export function invalidateCache(urlPattern) {
  for (const key of cache.keys()) {
    if (key.includes(urlPattern)) {
      cache.delete(key);
    }
  }
}

export default api;
