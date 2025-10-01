import "./App.css";
import { MapComponentsProvider, MapLibreMap } from "@mapcomponents/react-maplibre";
import { WHEREGROUP_WMS_URL, WHEREGROUP_HQ } from "./lib/constants";

function App() {
  return (
    <MapComponentsProvider>
      <MapLibreMap
        mapId="main"
        options={{
          style: {
            version: 8,
            sources: {
              "maptelling-wms-source": {
                type: "raster",
                tiles: [WHEREGROUP_WMS_URL],
                tileSize: 256
              }
            },
            layers: [{
              id: "maptelling-wms-layer",
              type: "raster",
              source: "maptelling-wms-source"
            }]
          },
          center: WHEREGROUP_HQ,
          zoom: 10,
        }}
        style={{ 
          position: "absolute", 
          top: 0, 
          bottom: 0, 
          left: 0, 
          right: 0 
        }}
      />
    </MapComponentsProvider>
  );
}

export default App;