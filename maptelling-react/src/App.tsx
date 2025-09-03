import React from 'react';
import { MapComponentsProvider } from '@mapcomponents/react-maplibre';
import MapTellingApp from './MapTellingApp';

function App() {
  return (
    <div className="App">
      <MapComponentsProvider>
        <MapTellingApp />
      </MapComponentsProvider>
    </div>
  );
}

export default App;
