import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
// A LINHA ABAIXO É OBRIGATÓRIA PARA O DESIGN FUNCIONAR
import './index.css'; 

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
