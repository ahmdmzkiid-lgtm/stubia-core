import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Automatically route all API calls to Railway backend when VITE_API_URL is configured
const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
if (API_BASE) {
  const originalFetch = window.fetch;
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    let target = input;
    if (typeof input === 'string') {
      if (input.startsWith('/api') || input.startsWith('/uploads')) {
        target = `${API_BASE}${input}`;
      }
    } else if (input instanceof URL) {
      if (input.pathname.startsWith('/api') || input.pathname.startsWith('/uploads')) {
        target = new URL(`${API_BASE}${input.pathname}${input.search}`);
      }
    }
    return originalFetch(target, {
      ...init,
      credentials: init?.credentials || 'include',
    });
  };
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Register PWA Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((reg) => {
        console.log('PWA Service Worker registered successfully:', reg.scope);
      })
      .catch((err) => {
        console.error('PWA Service Worker registration failed:', err);
      });
  });
}
