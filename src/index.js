import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { ConvexProvider, ConvexReactClient } from 'convex/react';

const root = ReactDOM.createRoot(document.getElementById('root'));

const convexUrl = process.env.REACT_APP_CONVEX_URL;
const convexClient = convexUrl ? new ConvexReactClient(convexUrl) : null;

root.render(
  <React.StrictMode>
    {convexClient ? (
      <ConvexProvider client={convexClient}>
        <App />
      </ConvexProvider>
    ) : (
      <App />
    )}
  </React.StrictMode>
);
