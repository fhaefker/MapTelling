import React from 'react';
import { createRoot } from 'react-dom/client';
import { MapComponentsProvider, MapLibreMap } from '@mapcomponents/react-maplibre';
import App from './modules/App';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MapComponentsProvider>
      <App />
    </MapComponentsProvider>
  </React.StrictMode>
);
