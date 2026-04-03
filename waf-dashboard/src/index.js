import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// ── Global Fetch Override for JWT Injection ──
const originalFetch = window.fetch;
window.fetch = async function () {
  let [resource, config] = arguments;
  const token = localStorage.getItem('waf_jwt_token');
  if (token && typeof resource === 'string' && resource.includes('/api/')) {
    if (!config) config = {};
    if (!config.headers) config.headers = {};
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return originalFetch.call(this, resource, config);
};
import ErrorBoundary from './components/ErrorBoundary';

// ── Standard React Mount ──
// We remove the shadow DOM isolation to allow global index.css to reach all components.
// The "waf-isolate" div from public/index.html is used as the mount point.

const rootElement = document.getElementById('waf-isolate') || document.getElementById('root');

if (rootElement) {
  // Check if we've already initialized this root to prevent React Error #299
  if (!rootElement._reactRoot) {
    const root = ReactDOM.createRoot(rootElement);
    rootElement._reactRoot = root;
    root.render(
      <React.StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </React.StrictMode>
    );
  }
} else {
  console.error("Mount target not found. Ensure <div id='waf-isolate'> exists in index.html.");
}
