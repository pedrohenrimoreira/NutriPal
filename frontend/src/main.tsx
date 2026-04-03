import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

/**
 * Entry point do NutriLens PWA.
 *
 * Renderiza o componente raiz <App /> no #root.
 * Service worker será registrado pelo vite-plugin-pwa quando habilitado.
 */
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
