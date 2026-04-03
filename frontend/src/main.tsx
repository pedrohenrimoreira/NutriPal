import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

const rootEl = document.getElementById('root');
const fallbackEl = document.getElementById('boot-fallback');

function showBootError(message: string): void {
  if (fallbackEl) {
    fallbackEl.textContent = message;
    fallbackEl.style.color = '#f87171';
  }
}

if (!rootEl) {
  showBootError('Falha ao iniciar: elemento root nao encontrado.');
} else {
  try {
    ReactDOM.createRoot(rootEl).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
    );
    if (fallbackEl) {
      fallbackEl.remove();
    }
  } catch (error) {
    console.error('Bootstrap error:', error);
    showBootError('Erro ao iniciar o app. Recarregue a pagina.');
  }
}
