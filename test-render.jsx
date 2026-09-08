import React from 'react';
import { renderToString } from 'react-dom/server';
import App from './frontend/src/App.jsx';
import './frontend/src/i18n.js';

try {
  const html = renderToString(<App />);
  console.log("RENDER SUCCESS!");
} catch (e) {
  console.error("RENDER FAILED:", e);
}
