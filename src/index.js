import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { ConvexProvider, ConvexReactClient } from 'convex/react';
import { AuthProvider } from './hooks/useAuth';

const root = ReactDOM.createRoot(document.getElementById('root'));

const convexUrl = process.env.REACT_APP_CONVEX_URL;
const convexClient = convexUrl ? new ConvexReactClient(convexUrl) : null;

root.render(
  <React.StrictMode>
    {convexClient ? (
      <ConvexProvider client={convexClient}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ConvexProvider>
    ) : (
      <App />
    )}
  </React.StrictMode>
);
