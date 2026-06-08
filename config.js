const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
window.__SITE_CONFIG__ = {
  API_BASE: isLocal ? 'http://127.0.0.1:3000' : 'https://rocktest.onrender.com',
};
