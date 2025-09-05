import React, { useMemo, useState, useEffect } from 'react';
import { MapLibreMap, MlWmsLayer, useMap } from '@mapcomponents/react-maplibre';

/*
  Regelwerk Bezug (mapcomponents_capabilities.md):
  - Section 11 (Konventionen): zentrale Map über MapLibreMap + declarative Layer.
  - Section 39/19: Nutzung spezialisierter Layer-Komponente statt imperativem addSource/addLayer.
  - WMS Layer (MlWmsLayer) deckt Integration eines externen OGC WMS ab.

  Hintergrunddienst: WhereGroup OSM Demo.
  Fester Endpoint: https://osm-demo.wheregroup.com (nur diese Hintergrundkarte verwenden)
*/

const wmsBaseUrl = 'https://osm-demo.wheregroup.com';

// Kleines Status/Fehler Monitoring für WMS (Map Ebene) – Section 48 (Fehler) / 56 (Performance Instrumentation)
const WmsStatus: React.FC<{ mapId: string; layerId: string }> = ({ mapId }) => {
  const { map } = useMap({ mapId });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  useEffect(() => {
    if (!map) return;
    const handler = (e: any) => {
      if (e?.error) setErrorMsg(e.error.message || 'Unbekannter Fehler');
    };
    map.map.on('error', handler);
    return () => { map.map.off('error', handler); };
  }, [map]);
  if (!errorMsg) return null;
  return <div style={{ position:'absolute', bottom:8, left:8, background:'#fff', padding:'4px 8px', fontSize:12, border:'1px solid #ccc' }}>WMS Fehler: {errorMsg}</div>;
};

const CentralMap: React.FC = () => {
  const wmsParams = useMemo(() => ({
    layers: 'OSM-WMS', // Layer Name laut GetCapabilities (häufig OSM-WMS oder OSM)
    format: 'image/png',
    transparent: false,
    version: '1.3.0'
  }), []);
  const [showWms, setShowWms] = useState(true);
  const [opacity, setOpacity] = useState(1);

  return (
    <>
      <div className="toolbar">
        <strong>OSM WMS Demo</strong>&nbsp;
        <button onClick={() => setShowWms(v => !v)} style={{ marginLeft:8 }}>
          {showWms ? 'Layer ausblenden' : 'Layer einblenden'}
        </button>
        <label style={{ marginLeft:12, fontSize:12 }}>
          Opacity {opacity.toFixed(2)}
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={opacity}
            onChange={e => setOpacity(Number(e.target.value))}
            style={{ verticalAlign:'middle', marginLeft:4 }}
          />
        </label>
      </div>
      <MapLibreMap
        mapId="main"
        options={{
          center: [7.0, 51.0],
          zoom: 5,
          style: {
            version: 8,
            sources: { 'empty': { type: 'vector', tiles: [] } },
            layers: []
          } as any
        }}
      />
      {showWms && (
        <MlWmsLayer
          mapId="main"
          url={wmsBaseUrl}
          urlParameters={wmsParams as any}
          layerId="osm-wms-basemap"
          layerOptions={{ paint: { 'raster-opacity': opacity } } as any}
        />
      )}
      <WmsStatus mapId="main" layerId="osm-wms-basemap" />
    </>
  );
};

export default CentralMap;
