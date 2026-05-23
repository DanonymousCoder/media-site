// Placeholder analytics + monitoring loader
// Replace the IDs with your real service keys before publishing.

// Example: Google Analytics (gtag.js) placeholder
window.RW_Analytics = {
  googleId: '', // e.g. 'G-XXXXXXXXXX'
  sentryDsn: ''  // e.g. 'https://...@sentry.io/1234'
};

export function init() {
  if (window.RW_Analytics.googleId) {
    // load gtag if provided
    const s = document.createElement('script');
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${window.RW_Analytics.googleId}`;
    document.head.appendChild(s);

    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);} // eslint-disable-line no-inner-declarations
    gtag('js', new Date());
    gtag('config', window.RW_Analytics.googleId);
  }

  if (window.RW_Analytics.sentryDsn) {
    // You can load Sentry here if desired. Keep disabled until you provide a DSN.
  }
}
