import React, { useState } from 'react';
import { I18nProvider } from './i18n/I18nProvider';
import { ChaptersProvider } from './context/ChaptersContext';
import { config } from './config/mapConfig';
import 'maplibre-gl/dist/maplibre-gl.css';
import './MapTellingApp.css';
import MapShell from './layout/MapShell';

const MapTellingApp: React.FC = () => {
  const [interactive, setInteractive] = useState(false);
  const [terrainEnabled, setTerrainEnabled] = useState(false);
  const [terrainExag, setTerrainExag] = useState(config.terrain?.exaggeration || 1.4);
  const [transitionSpeed, setTransitionSpeed] = useState(0.9);
  const [showPerf, setShowPerf] = useState(false);
  const [wmsCacheEnabled, setWmsCacheEnabled] = useState(false);
  return (
    <I18nProvider>
      <ChaptersProvider chapters={config.chapters}>
        <MapShell
          interactive={interactive}
            onToggleInteractive={() => setInteractive(p=>!p)}
            terrainEnabled={terrainEnabled}
            toggleTerrain={() => setTerrainEnabled(t=>!t)}
            terrainExag={terrainExag}
            setTerrainExag={setTerrainExag}
            transitionSpeed={transitionSpeed}
            setTransitionSpeed={setTransitionSpeed}
            showPerf={showPerf}
            togglePerf={()=>setShowPerf(p=>!p)}
            wmsCacheEnabled={wmsCacheEnabled}
            setWmsCacheEnabled={setWmsCacheEnabled}
        />
      </ChaptersProvider>
    </I18nProvider>
  );
};

export default MapTellingApp;
