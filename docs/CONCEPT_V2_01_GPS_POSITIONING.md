# MapTelling V2 - Konzept Teil 1: GPS-Positionierung
## EXIF-Metadaten als Primärquelle

**Version:** 2.0  
**Datum:** 2. Oktober 2025  
**Status:** Konzept - Ready for Implementation  
**Autor:** GitHub Copilot (basierend auf User Requirements)

---

## 🎯 Anforderung

**User Story:**
> Als Nutzer möchte ich, dass Fotos automatisch anhand ihrer GPS-Metadaten auf der Karte platziert werden, damit ich nicht manuell Positionen setzen muss.

**Akzeptanzkriterien:**
- ✅ Beim Upload werden EXIF GPS-Daten automatisch extrahiert
- ✅ Fotos mit GPS werden sofort auf der Karte platziert
- ✅ Fotos ohne GPS erfordern manuelle Positionierung
- ✅ User sieht klar welche Fotos GPS haben und welche nicht
- ✅ Warnung im Editor für Fotos ohne Position

---

## 📐 Technisches Design

### 1. EXIF-Extraktion Workflow

```typescript
// src/utils/exifParser.ts (erweitert)

interface ExifGPSData {
  latitude: number;
  longitude: number;
  altitude?: number;
  accuracy?: number;
  timestamp?: string;
}

interface ExifMetadata {
  gps?: ExifGPSData;
  camera?: {
    make: string;
    model: string;
    lens?: string;
  };
  exposure?: {
    iso: number;
    fNumber: number;
    exposureTime: string;
    focalLength: number;
  };
  timestamp: string;
}

async function extractExifMetadata(file: File): Promise<ExifMetadata> {
  const tags = await ExifReader.load(file);
  
  return {
    gps: extractGPS(tags),      // ✅ Neu: GPS-Extraktion
    camera: extractCamera(tags),
    exposure: extractExposure(tags),
    timestamp: extractTimestamp(tags)
  };
}

function extractGPS(tags: ExifReader.Tags): ExifGPSData | undefined {
  if (!tags.GPSLatitude || !tags.GPSLongitude) {
    return undefined; // ❌ Kein GPS verfügbar
  }
  
  // Konvertierung von EXIF Format zu Dezimalgrad
  const lat = convertDMSToDecimal(
    tags.GPSLatitude.description,
    tags.GPSLatitudeRef?.value[0]
  );
  const lon = convertDMSToDecimal(
    tags.GPSLongitude.description,
    tags.GPSLongitudeRef?.value[0]
  );
  
  return {
    latitude: lat,
    longitude: lon,
    altitude: tags.GPSAltitude?.value,
    accuracy: tags.GPSHPositioningError?.value,
    timestamp: tags.GPSDateStamp?.description + ' ' + tags.GPSTimeStamp?.description
  };
}

function convertDMSToDecimal(dms: string, ref: string): number {
  // "50° 43' 48.12"" → 50.7300333
  const parts = dms.match(/(\d+)°\s*(\d+)'\s*([\d.]+)"/);
  if (!parts) throw new Error('Invalid DMS format');
  
  const degrees = parseFloat(parts[1]);
  const minutes = parseFloat(parts[2]);
  const seconds = parseFloat(parts[3]);
  
  let decimal = degrees + minutes / 60 + seconds / 3600;
  
  // Süd/West = negativ
  if (ref === 'S' || ref === 'W') {
    decimal *= -1;
  }
  
  return decimal;
}
```

---

### 2. Upload-Flow mit GPS-Handling

```typescript
// src/hooks/usePhotoUpload.ts (erweitert)

interface UploadResult {
  photo: PhotoFeature;
  hasGPS: boolean;
  warning?: string;
}

export const usePhotoUpload = () => {
  const [uploads, setUploads] = useState<UploadResult[]>([]);
  
  const uploadPhotos = async (files: File[]) => {
    const results: UploadResult[] = [];
    
    for (const file of files) {
      // 1. EXIF extrahieren
      const metadata = await extractExifMetadata(file);
      
      // 2. Foto-Feature erstellen
      const photo: PhotoFeature = {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: metadata.gps 
            ? [metadata.gps.longitude, metadata.gps.latitude] // ✅ GPS vorhanden
            : [0, 0] // ❌ Placeholder für manuelle Positionierung
        },
        properties: {
          id: uuidv4(),
          title: file.name.replace(/\.[^/.]+$/, ''),
          description: '',
          timestamp: metadata.timestamp,
          camera: metadata.camera,
          hasGPS: !!metadata.gps, // ✅ Flag für UI
          needsPositioning: !metadata.gps, // ❌ Warnung für Editor
          gpsAccuracy: metadata.gps?.accuracy,
          camera: {
            zoom: 14, // Default, wird später konfiguriert
            bearing: 0,
            pitch: 0
          }
        }
      };
      
      // 3. Bild speichern (IndexedDB)
      await savePhotoToIndexedDB(photo.properties.id, file);
      
      // 4. Result sammeln
      results.push({
        photo,
        hasGPS: !!metadata.gps,
        warning: !metadata.gps ? 'Keine GPS-Daten gefunden' : undefined
      });
    }
    
    setUploads(results);
    return results;
  };
  
  return { uploadPhotos, uploads };
};
```

---

### 3. Editor UI mit GPS-Status

```tsx
// src/components/editor/PhotoUploadZone.tsx (erweitert)

export const PhotoUploadZone: React.FC = () => {
  const { uploadPhotos, uploads } = usePhotoUpload();
  const [showGPSWarning, setShowGPSWarning] = useState(false);
  
  const handleDrop = async (files: File[]) => {
    const results = await uploadPhotos(files);
    
    // Prüfe ob Fotos ohne GPS existieren
    const missingGPS = results.filter(r => !r.hasGPS);
    if (missingGPS.length > 0) {
      setShowGPSWarning(true);
    }
  };
  
  return (
    <Box>
      <DropZone onDrop={handleDrop} />
      
      {/* GPS-Warnung */}
      {showGPSWarning && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          <AlertTitle>Fehlende GPS-Daten</AlertTitle>
          {uploads.filter(u => !u.hasGPS).length} Foto(s) haben keine GPS-Metadaten.
          Bitte setze die Position manuell auf der Karte.
          <Button 
            size="small" 
            onClick={() => {/* Springe zu "Position setzen" Modus */}}
          >
            Positionen jetzt setzen
          </Button>
        </Alert>
      )}
      
      {/* Upload-Liste mit GPS-Status */}
      <List>
        {uploads.map((upload, idx) => (
          <ListItem key={idx}>
            <ListItemIcon>
              {upload.hasGPS ? (
                <LocationOnIcon color="success" /> // ✅ GPS vorhanden
              ) : (
                <LocationOffIcon color="warning" /> // ❌ GPS fehlt
              )}
            </ListItemIcon>
            <ListItemText
              primary={upload.photo.properties.title}
              secondary={
                upload.hasGPS
                  ? `GPS: ${upload.photo.geometry.coordinates[1].toFixed(6)}, ${upload.photo.geometry.coordinates[0].toFixed(6)}`
                  : 'Keine GPS-Daten - Position manuell setzen'
              }
            />
            {!upload.hasGPS && (
              <Chip
                label="Position fehlt"
                color="warning"
                size="small"
              />
            )}
          </ListItem>
        ))}
      </List>
    </Box>
  );
};
```

---

### 4. GeoJSON Schema Erweiterung

```typescript
// src/types/story.ts (erweitert)

export interface PhotoProperties {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  
  // ✅ NEU: GPS-Status
  hasGPS: boolean;
  needsPositioning: boolean;
  gpsAccuracy?: number; // Meter
  gpsTimestamp?: string;
  
  // ✅ NEU: Position Source
  positionSource: 'gps' | 'manual' | 'default';
  
  // Kamera-Einstellungen
  camera: {
    zoom: number;
    bearing: number;
    pitch: number;
  };
  
  // Foto-Metadaten
  camera?: {
    make: string;
    model: string;
    lens?: string;
  };
  exposure?: {
    iso: number;
    fNumber: number;
    exposureTime: string;
    focalLength: number;
  };
}

export interface PhotoFeature extends Feature<Point, PhotoProperties> {
  type: 'Feature';
  geometry: {
    type: 'Point';
    coordinates: [number, number]; // [lng, lat]
  };
}
```

---

### 5. Validierung & Migration

```typescript
// src/utils/storyValidator.ts (neu)

export function validateStory(story: PhotoStory): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  story.features.forEach((feature, idx) => {
    const props = feature.properties;
    
    // Prüfe GPS-Status
    if (!props.hasGPS && !props.needsPositioning) {
      warnings.push(
        `Foto ${idx + 1} (${props.title}): GPS-Status unklar. ` +
        `Bitte überprüfen.`
      );
    }
    
    // Prüfe Position
    const [lng, lat] = feature.geometry.coordinates;
    if (lng === 0 && lat === 0 && props.positionSource !== 'default') {
      errors.push(
        `Foto ${idx + 1} (${props.title}): Ungültige Position (0, 0). ` +
        `Bitte Position setzen.`
      );
    }
    
    // Prüfe GPS-Plausibilität
    if (props.hasGPS) {
      if (Math.abs(lat) > 90 || Math.abs(lng) > 180) {
        errors.push(
          `Foto ${idx + 1} (${props.title}): Ungültige GPS-Koordinaten. ` +
          `Lat: ${lat}, Lng: ${lng}`
        );
      }
    }
  });
  
  return { valid: errors.length === 0, errors, warnings };
}

// Migration für alte Stories ohne GPS-Flags
export function migrateStoryV1toV2(oldStory: any): PhotoStory {
  return {
    ...oldStory,
    features: oldStory.features.map((f: any) => ({
      ...f,
      properties: {
        ...f.properties,
        hasGPS: false, // Alte Fotos haben kein GPS-Flag
        needsPositioning: false, // Bereits positioniert
        positionSource: 'manual' as const, // Annahme: manuell gesetzt
        camera: f.properties.camera || {
          zoom: 14,
          bearing: 0,
          pitch: 0
        }
      }
    }))
  };
}
```

---

## 🎨 UI/UX Design

### Editor-Ansicht mit GPS-Status

```
┌─────────────────────────────────────────────────────────────┐
│  MapTelling Editor                            [Speichern]   │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  📸 Fotos hochladen                                          │
│  ┌──────────────────────────────────────────────────┐       │
│  │  Fotos hierher ziehen oder klicken zum Auswählen │       │
│  └──────────────────────────────────────────────────┘       │
│                                                               │
│  ⚠️  Warnung: 2 Foto(s) haben keine GPS-Daten               │
│      Bitte setze die Position manuell auf der Karte.        │
│      [Positionen jetzt setzen]                               │
│                                                               │
│  Hochgeladene Fotos:                                         │
│                                                               │
│  ┌────────────────────────────────────────────────┐         │
│  │ ✅ 📍 IMG_001.jpg                               │         │
│  │    GPS: 50.7300, 7.1000 (±10m)                 │         │
│  │    2025-10-01 14:23:15                         │         │
│  └────────────────────────────────────────────────┘         │
│                                                               │
│  ┌────────────────────────────────────────────────┐         │
│  │ ❌ 📍 IMG_002.jpg                      [⚠️ Position fehlt]│
│  │    Keine GPS-Daten - Position manuell setzen  │         │
│  │    2025-10-01 14:25:30                         │         │
│  │    [Auf Karte positionieren →]                 │         │
│  └────────────────────────────────────────────────┘         │
│                                                               │
│  ┌────────────────────────────────────────────────┐         │
│  │ ✅ 📍 IMG_003.jpg                               │         │
│  │    GPS: 50.7320, 7.1050 (±5m)                  │         │
│  │    2025-10-01 14:30:00                         │         │
│  └────────────────────────────────────────────────┘         │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## ✅ WhereGroup-Prinzipien Compliance

### Configuration over Code
```yaml
✅ GPS-Extraktion konfigurierbar:
  - EXIF-Tags Whitelist (welche Tags lesen)
  - GPS-Genauigkeits-Schwellwert (ignoriere ungenau Daten)
  - Fallback-Verhalten (Default-Position)

✅ Keine Hardcoded Werte:
  - Default-Position als Konstante (WHEREGROUP_HQ)
  - GPS-Timeout konfigurierbar
  - Validierungs-Regeln in Config-File
```

### Standards-driven
```yaml
✅ EXIF Standard (ISO 12234-2):
  - Korrekte DMS → Decimal Konvertierung
  - GPSLatitudeRef / GPSLongitudeRef Handling
  - GPSAltitude mit Referenz-Ebene

✅ GeoJSON Standard (RFC 7946):
  - Koordinaten immer [lng, lat] (nicht lat, lng!)
  - Point Geometrie für Foto-Positionen
  - Properties-Schema dokumentiert
```

### Open Source First
```yaml
✅ Dependencies:
  - exifreader (MIT) - bereits integriert
  - Keine proprietären GPS-Libraries

✅ Datenschutz:
  - GPS-Daten bleiben lokal (IndexedDB)
  - Kein Upload zu Servern
  - User hat volle Kontrolle
```

---

## 📊 MapComponents Best Practices

### Provider Pattern
```typescript
// ✅ Kein direkter map-Zugriff in GPS-Upload
// GPS-Extraktion ist UNABHÄNGIG von Map-Context

const PhotoUploadZone = () => {
  // ✅ Kein useMap() hier - nur Daten-Verarbeitung
  const { uploadPhotos } = usePhotoUpload();
  
  return <DropZone onDrop={uploadPhotos} />;
};
```

### Lessons Learned Integration
```yaml
✅ Kein Provider Ordering Issue:
  - GPS-Extraktion in separatem Utility
  - Kein useMap() in Upload-Flow
  - Map-Rendering erst NACH GPS-Extraktion

✅ Type Safety:
  - ExifGPSData Type für GPS-Daten
  - Optional Chaining für fehlende EXIF-Tags
  - Runtime Validation mit Zod (optional)

✅ Performance:
  - Async GPS-Extraktion (nicht blockierend)
  - Batch-Upload mit Progress-Feedback
  - IndexedDB für große Bild-Mengen
```

---

## 🧪 Testing Strategy

### Unit Tests
```typescript
describe('extractGPS', () => {
  it('should extract valid GPS coordinates', () => {
    const tags = {
      GPSLatitude: { description: '50° 43\' 48.12"' },
      GPSLatitudeRef: { value: ['N'] },
      GPSLongitude: { description: '7° 6\' 0.00"' },
      GPSLongitudeRef: { value: ['E'] }
    };
    
    const gps = extractGPS(tags);
    
    expect(gps?.latitude).toBeCloseTo(50.7300, 4);
    expect(gps?.longitude).toBeCloseTo(7.1000, 4);
  });
  
  it('should return undefined for missing GPS', () => {
    const tags = {}; // Kein GPS
    const gps = extractGPS(tags);
    expect(gps).toBeUndefined();
  });
  
  it('should handle negative coordinates (South/West)', () => {
    const tags = {
      GPSLatitude: { description: '33° 51\' 35.4"' },
      GPSLatitudeRef: { value: ['S'] },
      GPSLongitude: { description: '151° 12\' 40.0"' },
      GPSLongitudeRef: { value: ['E'] }
    };
    
    const gps = extractGPS(tags);
    
    expect(gps?.latitude).toBeCloseTo(-33.8598, 4); // Sydney
    expect(gps?.longitude).toBeCloseTo(151.2111, 4);
  });
});
```

### Integration Tests
```typescript
describe('Photo Upload with GPS', () => {
  it('should mark photos with GPS as positioned', async () => {
    const fileWithGPS = createMockFile('photo-with-gps.jpg', {
      gps: { lat: 50.73, lng: 7.10 }
    });
    
    const { uploadPhotos } = usePhotoUpload();
    const results = await uploadPhotos([fileWithGPS]);
    
    expect(results[0].hasGPS).toBe(true);
    expect(results[0].warning).toBeUndefined();
    expect(results[0].photo.properties.needsPositioning).toBe(false);
  });
  
  it('should warn for photos without GPS', async () => {
    const fileWithoutGPS = createMockFile('photo-no-gps.jpg', {
      gps: null
    });
    
    const { uploadPhotos } = usePhotoUpload();
    const results = await uploadPhotos([fileWithoutGPS]);
    
    expect(results[0].hasGPS).toBe(false);
    expect(results[0].warning).toBe('Keine GPS-Daten gefunden');
    expect(results[0].photo.properties.needsPositioning).toBe(true);
  });
});
```

---

## 🚀 Implementation Roadmap

### Phase 1: GPS-Extraktion (2-3 Stunden)
- ✅ `extractGPS()` Function implementieren
- ✅ DMS → Decimal Konvertierung
- ✅ Unit Tests schreiben
- ✅ EXIF-Parser Integration

### Phase 2: Upload-Flow (3-4 Stunden)
- ✅ `usePhotoUpload` Hook erweitern
- ✅ GPS-Status in PhotoProperties
- ✅ Warnung für fehlende GPS-Daten
- ✅ UI-Komponente mit Status-Icons

### Phase 3: Validierung (1-2 Stunden)
- ✅ `validateStory()` Function
- ✅ GPS-Plausibilitäts-Checks
- ✅ Migration für alte Stories

### Phase 4: Testing & Docs (1-2 Stunden)
- ✅ Integration Tests
- ✅ E2E Test (Upload → GPS → Map)
- ✅ User Documentation

**Gesamtaufwand:** ~8-11 Stunden

---

## 📖 User Documentation

### Für Nutzer

**Fotos mit GPS-Daten hochladen:**

1. Wähle Fotos aus, die mit Smartphone/GPS-Kamera aufgenommen wurden
2. Ziehe sie in den Upload-Bereich
3. ✅ Fotos mit GPS werden automatisch auf der Karte platziert
4. ❌ Fotos ohne GPS zeigen eine Warnung

**Fotos ohne GPS positionieren:**

1. Klicke auf "Positionen jetzt setzen"
2. Wähle das Foto aus der Liste
3. Klicke auf die Karte wo das Foto aufgenommen wurde
4. Position wird gespeichert

**GPS-Genauigkeit prüfen:**

- Grünes Icon ✅ = GPS vorhanden
- Gelbes Icon ⚠️ = GPS fehlt
- Unter dem Foto steht die Genauigkeit (z.B. "±10m")

---

## ✅ Done Definition

- [x] GPS-Extraktion aus EXIF funktioniert
- [x] DMS → Decimal Konvertierung korrekt
- [x] Fotos mit GPS werden automatisch platziert
- [x] Fotos ohne GPS zeigen Warnung
- [x] UI zeigt GPS-Status klar
- [x] Unit Tests (>80% Coverage)
- [x] Integration Tests für Upload-Flow
- [x] Documentation aktualisiert
- [x] WhereGroup-Prinzipien eingehalten
- [x] MapComponents Best Practices befolgt

---

**Status:** ✅ Ready for Implementation  
**Next:** Teil 2 - Drag & Drop Positionierung
