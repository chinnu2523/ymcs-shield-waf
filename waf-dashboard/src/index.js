import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';

// ── Global Fetch Override for JWT Injection ──
const originalFetch = window.fetch;
window.fetch = async function (resource, config = {}) {
  const token = localStorage.getItem('waf_jwt_token');
  
  // Extract URL string from resource (could be string, URL, or Request object)
  const url = typeof resource === 'string' 
    ? resource 
    : (resource instanceof Request ? resource.url : String(resource));

  if (url.includes('/api/')) {
    const isLogin = url.includes('/api/auth/login');
    
    // If no token and not login, we return 401 locally to trigger auth redirect
    if (!token && !isLogin) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Inject token if available
    if (token && !isLogin) {
      if (resource instanceof Request) {
        resource.headers.set('Authorization', `Bearer ${token}`);
      } else {
        const headers = config.headers instanceof Headers 
          ? config.headers 
          : new Headers(config.headers || {});
        
        headers.set('Authorization', `Bearer ${token}`);
        config.headers = headers;
        // If config was a plain object, update it to use the new Headers object
      }
    }
  }

  return originalFetch.call(this, resource, config);
};

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
