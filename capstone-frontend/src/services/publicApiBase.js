function trimTrailingSlashes(value) {
  return value.replace(/\/+$/, '');
}

function getBrowserOrigin() {
  if (typeof window === 'undefined') {
    return null;
  }

  const { protocol, hostname } = window.location;
  return `${protocol}//${hostname}:8000`;
}

export function getApiBaseUrl() {
  const configured = import.meta.env.VITE_API_URL;
  if (configured) {
    const normalized = trimTrailingSlashes(configured);
    return normalized.endsWith('/api/public')
      ? normalized.replace(/\/public$/, '')
      : normalized.endsWith('/api')
        ? normalized
        : `${normalized}/api`;
  }

  return `${getBrowserOrigin() || 'http://localhost:8000'}/api`;
}

export function getPublicApiBaseUrl() {
  const configured = trimTrailingSlashes(import.meta.env.VITE_API_URL || `${getBrowserOrigin() || 'http://localhost:8000'}/api/public`);

  if (configured.endsWith('/api/public')) {
    return configured;
  }

  if (configured.endsWith('/api')) {
    return `${configured}/public`;
  }

  return `${configured}/api/public`;
}
