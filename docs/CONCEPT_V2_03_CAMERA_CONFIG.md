# MapTelling V2 - Konzept Teil 3: Zoom & Kamera-Konfiguration
## Pro-Foto Kamera-Einstellungen

**Version:** 2.0 | **Datum:** 2. Oktober 2025 | **Status:** Ready for Implementation

---

## 🎯 Anforderung

**User Story:**
> Als Nutzer möchte ich für jedes Foto individuell Zoom, Bearing und Pitch konfigurieren, damit die Story-Ansicht genau so aussieht wie ich es möchte.

**Gewählte Varianten:**
- **3.1:** Beides (Slider + "Übernehmen" Button)
- **3.2:** Ja (Bearing + Pitch speichern)
- **3.3:** Automatisch berechnen basierend auf Foto-Dichte

---

## 📐 Technisches Design

### 1. Kamera-Config Interface

```typescript
// src/types/camera.ts (neu)

export interface CameraConfig {
  zoom: number;        // 0-22
  bearing: number;     // 0-359 (Grad)
  pitch: number;       // 0-60 (Grad)
  duration?: number;   // Animation ms (optional)
}

export interface AutoZoomConfig {
  minZoom: number;     // 8
  maxZoom: number;     // 18
  padding: number;     // 50px
  densityFactor: number; // 0.7 (70% der bbox)
}

// Automatische Zoom-Berechnung
export function calculateOptimalZoom(
  photos: PhotoFeature[],
  config: AutoZoomConfig
): number {
  if (photos.length === 0) return config.minZoom;
  if (photos.length === 1) return 14; // Single photo default
  
  // Berechne BBox aller Fotos
  const coords = photos.map(p => p.geometry.coordinates);
  const lngs = coords.map(c => c[0]);
  const lats = coords.map(c => c[1]);
  
  const bbox: [number, number, number, number] = [
    Math.min(...lngs),
    Math.min(...lats),
    Math.max(...lngs),
    Math.max(...lats)
  ];
  
  // Berechne Distanz
  const latDist = bbox[3] - bbox[1];
  const lngDist = bbox[2] - bbox[0];
  const maxDist = Math.max(latDist, lngDist);
  
  // Zoom basierend auf Distanz
  // Formel: zoom = log2(360 / distance) - 1
  let zoom = Math.log2(360 / maxDist) - 1;
  
  // Density-Faktor anwenden (engere BBox = höherer Zoom)
  zoom = zoom * config.densityFactor;
  
  // Clamp zwischen min/max
  return Math.max(
    config.minZoom,
    Math.min(config.maxZoom, Math.round(zoom))
  );
}
```

---

### 2. Camera Control Component

```tsx
// src/components/editor/CameraControls.tsx (neu)

interface CameraControlsProps {
  photo: PhotoFeature;
  onUpdate: (camera: CameraConfig) => void;
}

export const CameraControls: React.FC<CameraControlsProps> = ({
  photo,
  onUpdate
}) => {
  const { map, mapIsReady } = useMap({ mapId: 'editor-map' });
  const [localCamera, setLocalCamera] = useState<CameraConfig>(
    photo.properties.camera
  );
  
  // "Aktuellen Zoom übernehmen" Button
  const captureCurrentCamera = () => {
    if (!mapIsReady || !map?.map) return;
    
    const camera: CameraConfig = {
      zoom: map.map.getZoom(),
      bearing: map.map.getBearing(),
      pitch: map.map.getPitch()
    };
    
    setLocalCamera(camera);
    onUpdate(camera);
    
    toast.success('Kamera-Position übernommen');
  };
  
  // Preview: Fliege zu aktueller Config
  const previewCamera = () => {
    if (!mapIsReady || !map?.map) return;
    
    map.map.flyTo({
      center: photo.geometry.coordinates as [number, number],
      zoom: localCamera.zoom,
      bearing: localCamera.bearing,
      pitch: localCamera.pitch,
      duration: 1000
    });
  };
  
  // Reset auf Auto-Zoom
  const resetToAuto = () => {
    const autoZoom = calculateOptimalZoom([photo], {
      minZoom: 8,
      maxZoom: 18,
      padding: 50,
      densityFactor: 0.7
    });
    
    const camera: CameraConfig = {
      zoom: autoZoom,
      bearing: 0,
      pitch: 0
    };
    
    setLocalCamera(camera);
    onUpdate(camera);
  };
  
  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Kamera-Einstellungen
      </Typography>
      
      {/* Zoom Slider */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="body2" gutterBottom>
          Zoom: {localCamera.zoom.toFixed(1)}
        </Typography>
        <Slider
          value={localCamera.zoom}
          min={8}
          max={18}
          step={0.1}
          onChange={(_, value) => {
            const newCamera = { ...localCamera, zoom: value as number };
            setLocalCamera(newCamera);
            onUpdate(newCamera);
          }}
          marks={[
            { value: 8, label: '8' },
            { value: 12, label: '12' },
            { value: 16, label: '16' },
            { value: 18, label: '18' }
          ]}
        />
      </Box>
      
      {/* Bearing Slider */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="body2" gutterBottom>
          Rotation: {localCamera.bearing.toFixed(0)}°
        </Typography>
        <Slider
          value={localCamera.bearing}
          min={0}
          max={359}
          step={1}
          onChange={(_, value) => {
            const newCamera = { ...localCamera, bearing: value as number };
            setLocalCamera(newCamera);
            onUpdate(newCamera);
          }}
        />
      </Box>
      
      {/* Pitch Slider */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="body2" gutterBottom>
          Neigung: {localCamera.pitch.toFixed(0)}°
        </Typography>
        <Slider
          value={localCamera.pitch}
          min={0}
          max={60}
          step={1}
          onChange={(_, value) => {
            const newCamera = { ...localCamera, pitch: value as number };
            setLocalCamera(newCamera);
            onUpdate(newCamera);
          }}
        />
      </Box>
      
      {/* Action Buttons */}
      <Stack spacing={1}>
        <Button
          variant="contained"
          startIcon={<CameraAltIcon />}
          onClick={captureCurrentCamera}
          fullWidth
        >
          Aktuellen Zoom übernehmen
        </Button>
        
        <Button
          variant="outlined"
          startIcon={<VisibilityIcon />}
          onClick={previewCamera}
          fullWidth
        >
          Vorschau
        </Button>
        
        <Button
          variant="text"
          startIcon={<RefreshIcon />}
          onClick={resetToAuto}
          fullWidth
        >
          Automatisch berechnen
        </Button>
      </Stack>
      
      {/* Info */}
      <Alert severity="info" sx={{ mt: 2 }}>
        <Typography variant="caption">
          Diese Einstellungen werden verwendet wenn das Foto in der Story angezeigt wird.
        </Typography>
      </Alert>
    </Box>
  );
};
```

---

### 3. Story Viewer Integration

```tsx
// src/hooks/useScrollSync.ts (erweitert mit Camera Config)

export const useScrollSync = ({
  mapId,
  photos,
  activeIndex,
  onPhotoChange
}: UseScrollSyncOptions) => {
  const { map, mapIsReady } = useMap({ mapId });
  
  // Fly to Photo mit individueller Kamera
  const flyToPhoto = useCallback((index: number) => {
    if (!mapIsReady || !map?.map || !photos[index]) return;
    
    const photo = photos[index];
    const camera = photo.properties.camera;
    
    map.map.flyTo({
      center: photo.geometry.coordinates as [number, number],
      zoom: camera.zoom,
      bearing: camera.bearing,
      pitch: camera.pitch,
      duration: prefersReducedMotion.current ? 0 : 1500,
      essential: true
    });
  }, [mapIsReady, map, photos]);
  
  // ... rest of hook
};
```

---

## 🎨 UI/UX Design

```
┌─────────────────────────────────────────────────────────────┐
│  Foto bearbeiten: IMG_001.jpg                               │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  📸 Kamera-Einstellungen                                    │
│                                                              │
│  Zoom: 14.5                                                 │
│  ├────────●─────────────────────┤  [8]    [12]    [18]     │
│                                                              │
│  Rotation: 45°                                              │
│  ├───────────────────●──────────┤  [0°]           [359°]   │
│                                                              │
│  Neigung: 30°                                               │
│  ├──────────●───────────────────┤  [0°]            [60°]   │
│                                                              │
│  ┌────────────────────────────────────────────┐            │
│  │  📷  Aktuellen Zoom übernehmen             │            │
│  └────────────────────────────────────────────┘            │
│                                                              │
│  ┌────────────────────────────────────────────┐            │
│  │  👁️  Vorschau                              │            │
│  └────────────────────────────────────────────┘            │
│                                                              │
│  ┌────────────────────────────────────────────┐            │
│  │  🔄  Automatisch berechnen                 │            │
│  └────────────────────────────────────────────┘            │
│                                                              │
│  ℹ️  Diese Einstellungen werden verwendet wenn das Foto    │
│     in der Story angezeigt wird.                            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## ✅ Implementation Roadmap

**Phase 1:** Auto-Zoom Berechnung (2h)  
**Phase 2:** CameraControls Component (3h)  
**Phase 3:** useScrollSync Integration (2h)  
**Phase 4:** Testing (2h)

**Gesamtaufwand:** ~9 Stunden

---

**Status:** ✅ Ready for Implementation  
**Next:** Teil 4 - Initial View & Zoom-Trigger
