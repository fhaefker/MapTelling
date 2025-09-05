import React from 'react';
import { createRoot } from 'react-dom/client';
import { MapComponentsProvider } from '@mapcomponents/react-maplibre';
import App from './modules/App';
import './global.css';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MapComponentsProvider>
      <App />
    </MapComponentsProvider>
  </React.StrictMode>
);
