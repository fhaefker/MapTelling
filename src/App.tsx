import "./App.css";
import { MapComponentsProvider, MapLibreMap } from "@mapcomponents/react-maplibre";

function App() {
  // WhereGroup WMS Demo Service
  const wmsUrl = "https://osm-demo.wheregroup.com/service?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&FORMAT=image%2Fpng&TRANSPARENT=true&LAYERS=osm&CRS=EPSG%3A3857&STYLES=&WIDTH=256&HEIGHT=256&BBOX={bbox-epsg-3857}";
  
  return (
    <MapComponentsProvider>
      <MapLibreMap
        mapId="main"
        options={{
          style: {
            version: 8,
            sources: {
              "wms-source": {
                type: "raster",
                tiles: [wmsUrl],
                tileSize: 256
              }
            },
            layers: [{
              id: "wms-layer",
              type: "raster",
              source: "wms-source"
            }]
          },
          center: [7.1, 50.73], // Bonn, WhereGroup HQ
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