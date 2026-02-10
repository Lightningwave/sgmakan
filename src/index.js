import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));

// StrictMode disabled to prevent AbortError with Supabase Auth
// Re-enable for production testing if needed
root.render(<App />);
