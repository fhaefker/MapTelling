import "./App.css";
import { MapComponentsProvider, MapLibreMap, getTheme } from "@mapcomponents/react-maplibre";
import { ThemeProvider } from "@mui/material";
import { WHEREGROUP_WMS_URL, WHEREGROUP_HQ, LAYER_IDS, MAP_SETTINGS } from "./lib/constants";

/**
 * MapTelling App
 * 
 * ✅ MapComponents Compliant:
 * - Single MapComponentsProvider (Root)
 * - Theme Integration via getTheme()
 * - Constants statt Hardcoding
 * 
 * ✅ WhereGroup Principles:
 * - WhereGroup WMS als Basemap
 * - Configuration over Code
 * - Namespace-Prefix auf allen IDs
 * 
 * @version 2.0
 */
function App() {
  // ✅ MapComponents Theme Integration
  const theme = getTheme('light');
  
  return (
    <ThemeProvider theme={theme}>
      <MapComponentsProvider>
        <MapLibreMap
          mapId={MAP_SETTINGS.mapId}
          options={{
            style: {
              version: 8,
              sources: {
                [LAYER_IDS.wmsSource]: {
                  type: "raster",
                  tiles: [WHEREGROUP_WMS_URL],
                  tileSize: 256
                }
              },
              layers: [{
                id: LAYER_IDS.wmsLayer,
                type: "raster",
                source: LAYER_IDS.wmsSource
              }]
            },
            center: WHEREGROUP_HQ,
            zoom: 10,
            minZoom: MAP_SETTINGS.minZoom,
            maxZoom: MAP_SETTINGS.maxZoom
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
    </ThemeProvider>
  );
}

export default App;