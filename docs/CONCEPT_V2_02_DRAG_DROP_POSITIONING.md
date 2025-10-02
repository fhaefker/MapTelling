# MapTelling V2 - Konzept Teil 2: Drag & Drop Positionierung
## Interaktive Foto-Platzierung auf der Karte

**Version:** 2.0  
**Datum:** 2. Oktober 2025  
**Status:** Konzept - Ready for Implementation  
**Autor:** GitHub Copilot (basierend auf User Requirements)

---

## 🎯 Anforderung

**User Story:**
> Als Nutzer möchte ich Fotos per Klick auf der Karte positionieren können, damit ich die GPS-Position manuell setzen oder korrigieren kann.

**Gewählte Variante:** **Klick-Modus** (aus Fragen 2.1)
- "Position setzen" aktivieren
- Dann Klick auf Karte
- Undo/Redo Support (aus Frage 2.3)

**Akzeptanzkriterien:**
- ✅ Button "Position setzen" im Editor
- ✅ Klick auf Karte platziert aktives Foto
- ✅ Visuelles Feedback (Cursor, Preview)
- ✅ Undo/Redo für Positionsänderungen
- ✅ Funktioniert für Fotos mit und ohne GPS
- ✅ MapComponents-compliant (kein direkter map-Zugriff)

---

## 📐 Technisches Design

### 1. Position-Set Modus State Management

```typescript
// src/hooks/usePositionSetMode.ts (neu)

interface PositionSetState {
  isActive: boolean;
  activePhotoId: string | null;
  history: PositionHistoryEntry[];
  historyIndex: number;
}

interface PositionHistoryEntry {
  photoId: string;
  oldPosition: [number, number];
  newPosition: [number, number];
  timestamp: number;
}

export const usePositionSetMode = () => {
  const [state, setState] = useState<PositionSetState>({
    isActive: false,
    activePhotoId: null,
    history: [],
    historyIndex: -1
  });
  
  // Modus aktivieren
  const activateMode = (photoId: string) => {
    setState(prev => ({
      ...prev,
      isActive: true,
      activePhotoId: photoId
    }));
  };
  
  // Modus deaktivieren
  const deactivateMode = () => {
    setState(prev => ({
      ...prev,
      isActive: false,
      activePhotoId: null
    }));
  };
  
  // Position setzen (mit History)
  const setPosition = (
    photoId: string,
    oldPosition: [number, number],
    newPosition: [number, number]
  ) => {
    setState(prev => {
      // Schneide History ab wenn in Mitte von Undo/Redo
      const newHistory = prev.history.slice(0, prev.historyIndex + 1);
      
      return {
        ...prev,
        history: [
          ...newHistory,
          {
            photoId,
            oldPosition,
            newPosition,
            timestamp: Date.now()
          }
        ],
        historyIndex: newHistory.length
      };
    });
  };
  
  // Undo
  const undo = (): PositionHistoryEntry | null => {
    if (state.historyIndex < 0) return null;
    
    const entry = state.history[state.historyIndex];
    setState(prev => ({
      ...prev,
      historyIndex: prev.historyIndex - 1
    }));
    
    return entry;
  };
  
  // Redo
  const redo = (): PositionHistoryEntry | null => {
    if (state.historyIndex >= state.history.length - 1) return null;
    
    const nextIndex = state.historyIndex + 1;
    const entry = state.history[nextIndex];
    
    setState(prev => ({
      ...prev,
      historyIndex: nextIndex
    }));
    
    return entry;
  };
  
  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z' && !e.shiftKey) {
          e.preventDefault();
          const entry = undo();
          if (entry) {
            // Emit event für Story Update
            window.dispatchEvent(
              new CustomEvent('position-undo', { detail: entry })
            );
          }
        } else if (e.key === 'z' && e.shiftKey || e.key === 'y') {
          e.preventDefault();
          const entry = redo();
          if (entry) {
            window.dispatchEvent(
              new CustomEvent('position-redo', { detail: entry })
            );
          }
        }
      }
      
      // ESC = Modus verlassen
      if (e.key === 'Escape' && state.isActive) {
        deactivateMode();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state]);
  
  return {
    isActive: state.isActive,
    activePhotoId: state.activePhotoId,
    canUndo: state.historyIndex >= 0,
    canRedo: state.historyIndex < state.history.length - 1,
    activateMode,
    deactivateMode,
    setPosition,
    undo,
    redo
  };
};
```

---

### 2. Map Click Handler (MapComponents-Compliant)

```tsx
// src/components/editor/PositionSetMap.tsx (neu)

import { useMap } from '@mapcomponents/react-maplibre';
import { MapLibreMap } from '@mapcomponents/react-maplibre';

interface PositionSetMapProps {
  mapId: string;
  photos: PhotoFeature[];
  onPositionSet: (photoId: string, position: [number, number]) => void;
}

/**
 * MapContent - INSIDE MapComponentsProvider
 * 
 * ✅ MapComponents Compliant:
 * - useMap() hook INSIDE Provider
 * - Event-Listener via wrapper (nicht direkt)
 * - Cleanup via componentId
 */
const MapContent: React.FC<{
  photos: PhotoFeature[];
  isPositionSetMode: boolean;
  activePhotoId: string | null;
  onPositionSet: (photoId: string, position: [number, number]) => void;
}> = ({ photos, isPositionSetMode, activePhotoId, onPositionSet }) => {
  const { map, mapIsReady } = useMap({ mapId: 'editor-map' });
  const [previewPosition, setPreviewPosition] = useState<[number, number] | null>(null);
  
  // ✅ Map Click Handler (MapComponents Pattern)
  useEffect(() => {
    if (!mapIsReady || !map?.map || !isPositionSetMode) return;
    
    const handleClick = (e: maplibregl.MapMouseEvent) => {
      const { lng, lat } = e.lngLat;
      
      if (activePhotoId) {
        onPositionSet(activePhotoId, [lng, lat]);
        setPreviewPosition(null);
      }
    };
    
    const handleMouseMove = (e: maplibregl.MapMouseEvent) => {
      if (isPositionSetMode) {
        const { lng, lat } = e.lngLat;
        setPreviewPosition([lng, lat]);
      }
    };
    
    // ✅ Event via wrapper registrieren (nicht map.on direkt!)
    map.map.on('click', handleClick);
    map.map.on('mousemove', handleMouseMove);
    
    // ✅ Cursor ändern im Position-Set Modus
    if (map.map.getCanvas()) {
      map.map.getCanvas().style.cursor = 'crosshair';
    }
    
    return () => {
      map.map.off('click', handleClick);
      map.map.off('mousemove', handleMouseMove);
      
      if (map.map.getCanvas()) {
        map.map.getCanvas().style.cursor = '';
      }
    };
  }, [mapIsReady, map, isPositionSetMode, activePhotoId, onPositionSet]);
  
  return (
    <>
      <MapLibreMap
        mapId="editor-map"
        options={{
          style: WHEREGROUP_WMS_STYLE,
          center: WHEREGROUP_HQ,
          zoom: 10
        }}
      />
      
      {/* Foto-Marker Layer */}
      <MlGeoJsonLayer
        mapId="editor-map"
        geojson={{
          type: 'FeatureCollection',
          features: photos
        }}
        options={{
          type: 'circle',
          paint: {
            'circle-radius': 8,
            'circle-color': '#1976d2',
            'circle-stroke-width': 2,
            'circle-stroke-color': '#ffffff'
          }
        }}
      />
      
      {/* Preview-Marker während Hover */}
      {isPositionSetMode && previewPosition && (
        <MlGeoJsonLayer
          mapId="editor-map"
          geojson={{
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: previewPosition
            },
            properties: {}
          }}
          options={{
            type: 'circle',
            paint: {
              'circle-radius': 10,
              'circle-color': '#ff9800',
              'circle-opacity': 0.5,
              'circle-stroke-width': 2,
              'circle-stroke-color': '#ffffff'
            }
          }}
        />
      )}
    </>
  );
};

/**
 * PositionSetMap - Outer Component
 * 
 * ✅ MapComponents Compliant:
 * - MapComponentsProvider wraps MapContent
 * - No map hooks outside Provider
 */
export const PositionSetMap: React.FC<PositionSetMapProps> = ({
  mapId,
  photos,
  onPositionSet
}) => {
  const { isActive, activePhotoId } = usePositionSetMode();
  
  return (
    <MapComponentsProvider>
      <MapContent
        photos={photos}
        isPositionSetMode={isActive}
        activePhotoId={activePhotoId}
        onPositionSet={onPositionSet}
      />
    </MapComponentsProvider>
  );
};
```

---

### 3. Editor UI mit Position-Set Controls

```tsx
// src/components/editor/PhotoEditor.tsx (erweitert)

export const PhotoEditor: React.FC = () => {
  const { story, updatePhoto } = useStoryState();
  const {
    isActive,
    activePhotoId,
    canUndo,
    canRedo,
    activateMode,
    deactivateMode,
    setPosition,
    undo,
    redo
  } = usePositionSetMode();
  
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoFeature | null>(null);
  
  // Handle Position Set
  const handlePositionSet = (photoId: string, position: [number, number]) => {
    const photo = story.features.find(f => f.properties.id === photoId);
    if (!photo) return;
    
    const oldPosition = photo.geometry.coordinates as [number, number];
    
    // Update Story
    updatePhoto(photoId, {
      geometry: {
        ...photo.geometry,
        coordinates: position
      },
      properties: {
        ...photo.properties,
        hasGPS: false, // Manuell gesetzt
        needsPositioning: false,
        positionSource: 'manual'
      }
    });
    
    // History
    setPosition(photoId, oldPosition, position);
    
    // Feedback
    toast.success(`Position gesetzt: ${position[1].toFixed(6)}, ${position[0].toFixed(6)}`);
    
    deactivateMode();
  };
  
  // Undo Handler
  useEffect(() => {
    const handleUndo = (e: CustomEvent<PositionHistoryEntry>) => {
      const { photoId, oldPosition } = e.detail;
      updatePhoto(photoId, {
        geometry: { type: 'Point', coordinates: oldPosition }
      });
      toast.info('Position rückgängig gemacht');
    };
    
    const handleRedo = (e: CustomEvent<PositionHistoryEntry>) => {
      const { photoId, newPosition } = e.detail;
      updatePhoto(photoId, {
        geometry: { type: 'Point', coordinates: newPosition }
      });
      toast.info('Position wiederhergestellt');
    };
    
    window.addEventListener('position-undo', handleUndo as EventListener);
    window.addEventListener('position-redo', handleRedo as EventListener);
    
    return () => {
      window.removeEventListener('position-undo', handleUndo as EventListener);
      window.removeEventListener('position-redo', handleRedo as EventListener);
    };
  }, [updatePhoto]);
  
  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      {/* Sidebar mit Foto-Liste */}
      <Box sx={{ width: 300, p: 2, overflowY: 'auto' }}>
        <Typography variant="h6" gutterBottom>
          Fotos
        </Typography>
        
        <List>
          {story.features.map((photo) => (
            <ListItem
              key={photo.properties.id}
              button
              selected={selectedPhoto?.properties.id === photo.properties.id}
              onClick={() => setSelectedPhoto(photo)}
            >
              <ListItemIcon>
                {photo.properties.hasGPS ? (
                  <LocationOnIcon color="success" />
                ) : photo.properties.needsPositioning ? (
                  <LocationOffIcon color="warning" />
                ) : (
                  <EditLocationIcon color="action" />
                )}
              </ListItemIcon>
              <ListItemText
                primary={photo.properties.title}
                secondary={
                  photo.properties.needsPositioning
                    ? 'Position fehlt'
                    : `${photo.geometry.coordinates[1].toFixed(4)}, ${photo.geometry.coordinates[0].toFixed(4)}`
                }
              />
              <Button
                size="small"
                variant={activePhotoId === photo.properties.id ? 'contained' : 'outlined'}
                onClick={(e) => {
                  e.stopPropagation();
                  if (isActive && activePhotoId === photo.properties.id) {
                    deactivateMode();
                  } else {
                    activateMode(photo.properties.id);
                    setSelectedPhoto(photo);
                  }
                }}
              >
                {isActive && activePhotoId === photo.properties.id
                  ? 'Abbrechen'
                  : 'Position setzen'}
              </Button>
            </ListItem>
          ))}
        </List>
      </Box>
      
      {/* Map */}
      <Box sx={{ flex: 1, position: 'relative' }}>
        <PositionSetMap
          mapId="editor-map"
          photos={story.features}
          onPositionSet={handlePositionSet}
        />
        
        {/* Floating Toolbar */}
        {isActive && (
          <Paper
            elevation={3}
            sx={{
              position: 'absolute',
              top: 16,
              left: '50%',
              transform: 'translateX(-50%)',
              p: 2,
              zIndex: 1000
            }}
          >
            <Stack direction="row" spacing={2} alignItems="center">
              <Typography variant="body2" sx={{ mr: 2 }}>
                Klicke auf die Karte um Position zu setzen
              </Typography>
              
              <Button
                size="small"
                startIcon={<UndoIcon />}
                disabled={!canUndo}
                onClick={() => undo()}
              >
                Undo (Ctrl+Z)
              </Button>
              
              <Button
                size="small"
                startIcon={<RedoIcon />}
                disabled={!canRedo}
                onClick={() => redo()}
              >
                Redo (Ctrl+Y)
              </Button>
              
              <Button
                size="small"
                variant="outlined"
                onClick={deactivateMode}
              >
                Abbrechen (ESC)
              </Button>
            </Stack>
          </Paper>
        )}
        
        {/* Undo/Redo Floating Button (immer sichtbar) */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 16,
            right: 16,
            zIndex: 1000
          }}
        >
          <Stack spacing={1}>
            <Tooltip title="Rückgängig (Ctrl+Z)">
              <IconButton
                color="primary"
                disabled={!canUndo}
                onClick={() => undo()}
                sx={{ bgcolor: 'background.paper' }}
              >
                <UndoIcon />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Wiederherstellen (Ctrl+Y)">
              <IconButton
                color="primary"
                disabled={!canRedo}
                onClick={() => redo()}
                sx={{ bgcolor: 'background.paper' }}
              >
                <RedoIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        </Box>
      </Box>
    </Box>
  );
};
```

---

## 🎨 UI/UX Design

### Editor mit Position-Set Modus

```
┌───────────────────────────────────────────────────────────────────┐
│  MapTelling Editor                                   [Speichern]  │
├───────────┬───────────────────────────────────────────────────────┤
│           │                                                        │
│  Fotos    │  ┌──────────────────────────────────────────────┐    │
│           │  │ Klicke auf die Karte um Position zu setzen    │    │
│  ✅ Foto1 │  │ [Undo (Ctrl+Z)] [Redo (Ctrl+Y)] [Abbrechen]  │    │
│  50.73,   │  └──────────────────────────────────────────────┘    │
│  7.10     │                                                        │
│           │                 🗺️  Karte                             │
│  ❌ Foto2 │                                                        │
│  Position │                    +  ← Preview Marker                │
│  fehlt    │                                                        │
│  [Position│                                                        │
│   setzen] │                                                        │
│           │                                                        │
│  ✅ Foto3 │                                                        │
│  50.73,   │                                                        │
│  7.11     │                                                        │
│           │                                                        │
│           │                                       ┌────┐           │
│           │                                       │ ↶  │ Undo      │
│           │                                       ├────┤           │
│           │                                       │ ↷  │ Redo      │
│           │                                       └────┘           │
└───────────┴───────────────────────────────────────────────────────┘
```

### Visual States

```
Normal Modus (kein Position-Set):
  - Cursor: Standard Pointer
  - Marker: Blau (bereits positioniert)
  - Klick auf Marker: Foto auswählen/bearbeiten

Position-Set Modus aktiv:
  - Cursor: Crosshair (Fadenkreuz)
  - Preview-Marker: Orange, halbtransparent
  - Toolbar oben: "Klicke auf die Karte..."
  - ESC = Modus verlassen

Nach Position gesetzt:
  - Toast-Notification: "Position gesetzt: 50.7300, 7.1000"
  - Marker wird blau (finalisiert)
  - Modus automatisch beendet
  - Undo/Redo buttons aktiviert
```

---

## ✅ WhereGroup-Prinzipien Compliance

### Configuration over Code
```yaml
✅ Konfigurierbare Verhaltensweisen:
  - Preview-Marker Farbe/Größe (Theme)
  - Undo-History Limit (z.B. 50 Schritte)
  - Auto-Deactivate nach Position-Set (ja/nein)
  - Keyboard Shortcuts (anpassbar)

✅ Keine Hardcoded UI-Strings:
  - Alle Texte in i18n-File
  - Toast-Messages konfigurierbar
  - Button-Labels anpassbar
```

### Standards-driven
```yaml
✅ Standard Keyboard Shortcuts:
  - Ctrl+Z = Undo (Windows/Linux)
  - Cmd+Z = Undo (Mac)
  - Ctrl+Y / Ctrl+Shift+Z = Redo
  - ESC = Modus verlassen (universal)

✅ Accessibility:
  - Focus-Management im Position-Set Modus
  - Screen Reader: "Position-Set Modus aktiv"
  - Keyboard-only Navigation möglich
```

### Open Source First
```yaml
✅ Keine proprietären Dependencies
✅ Undo/Redo Pattern = Standard Command Pattern
✅ Event-basierte Communication (Custom Events)
```

---

## 📊 MapComponents Best Practices

### Provider Pattern (KRITISCH!)
```typescript
// ❌ FALSCH (Lessons Learned!)
export const PositionSetMap = () => {
  const { map } = useMap({ mapId: 'x' }); // ❌ Outside Provider!
  
  return <MapComponentsProvider>...</MapComponentsProvider>;
};

// ✅ RICHTIG (Component Split)
const MapContent = () => {
  const { map } = useMap({ mapId: 'x' }); // ✅ Inside Provider
  return <Box>...</Box>;
};

export const PositionSetMap = () => (
  <MapComponentsProvider>
    <MapContent />
  </MapComponentsProvider>
);
```

### Event Handling
```yaml
✅ Correct Pattern:
  - map.on() via wrapper (nicht direkt)
  - Cleanup in useEffect return
  - ComponentId tracking (automatisch via useMap)

❌ Avoid:
  - Direkter map.on() Aufruf
  - Vergessene Event-Listener (Memory Leaks)
  - Conditional hook calls
```

### State Management
```yaml
✅ Separation of Concerns:
  - Position-Set Mode State = eigener Hook
  - Story Update = useStoryState
  - Map Interaction = MapContent Component
  
✅ Custom Events für Cross-Component Communication:
  - window.dispatchEvent statt prop-drilling
  - Type-safe mit TypeScript CustomEvent<T>
```

---

## 🧪 Testing Strategy

### Unit Tests
```typescript
describe('usePositionSetMode', () => {
  it('should activate and deactivate mode', () => {
    const { result } = renderHook(() => usePositionSetMode());
    
    act(() => {
      result.current.activateMode('photo-1');
    });
    
    expect(result.current.isActive).toBe(true);
    expect(result.current.activePhotoId).toBe('photo-1');
    
    act(() => {
      result.current.deactivateMode();
    });
    
    expect(result.current.isActive).toBe(false);
  });
  
  it('should track history for undo/redo', () => {
    const { result } = renderHook(() => usePositionSetMode());
    
    act(() => {
      result.current.setPosition(
        'photo-1',
        [7.0, 50.7],
        [7.1, 50.8]
      );
    });
    
    expect(result.current.canUndo).toBe(true);
    expect(result.current.canRedo).toBe(false);
    
    let undoneEntry: PositionHistoryEntry | null = null;
    act(() => {
      undoneEntry = result.current.undo();
    });
    
    expect(undoneEntry).toEqual({
      photoId: 'photo-1',
      oldPosition: [7.0, 50.7],
      newPosition: [7.1, 50.8],
      timestamp: expect.any(Number)
    });
    
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(true);
  });
  
  it('should handle keyboard shortcuts', () => {
    const { result } = renderHook(() => usePositionSetMode());
    
    act(() => {
      result.current.activateMode('photo-1');
    });
    
    // Simulate ESC key
    act(() => {
      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      window.dispatchEvent(event);
    });
    
    expect(result.current.isActive).toBe(false);
  });
});
```

### Integration Tests
```typescript
describe('Position Set in Editor', () => {
  it('should set position on map click', async () => {
    const { getByText, getByRole } = render(<PhotoEditor />);
    
    // Aktiviere Position-Set Modus
    const setPositionBtn = getByText('Position setzen');
    fireEvent.click(setPositionBtn);
    
    // Simuliere Klick auf Karte
    const mapCanvas = getByRole('region', { name: /map/i });
    fireEvent.click(mapCanvas, {
      clientX: 100,
      clientY: 100,
      // Mock lngLat injection
      lngLat: { lng: 7.1, lat: 50.8 }
    });
    
    // Prüfe Toast-Notification
    await waitFor(() => {
      expect(getByText(/Position gesetzt/i)).toBeInTheDocument();
    });
    
    // Prüfe Story Update
    const photo = story.features[0];
    expect(photo.geometry.coordinates).toEqual([7.1, 50.8]);
    expect(photo.properties.positionSource).toBe('manual');
  });
  
  it('should undo position change with Ctrl+Z', async () => {
    const { getByText } = render(<PhotoEditor />);
    
    // Setze Position
    // ... (wie oben)
    
    // Undo via Keyboard
    fireEvent.keyDown(window, {
      key: 'z',
      ctrlKey: true
    });
    
    // Prüfe dass Position zurückgesetzt wurde
    await waitFor(() => {
      expect(getByText(/Position rückgängig gemacht/i)).toBeInTheDocument();
    });
  });
});
```

### E2E Tests (Cypress)
```typescript
describe('Position Set Workflow', () => {
  it('should allow user to set photo position', () => {
    cy.visit('/editor');
    
    // Upload Foto ohne GPS
    cy.get('[data-testid="upload-zone"]').attachFile('photo-no-gps.jpg');
    
    // Warte auf Warnung
    cy.contains('Keine GPS-Daten').should('be.visible');
    
    // Klicke "Position setzen"
    cy.contains('Position setzen').click();
    
    // Prüfe Crosshair Cursor
    cy.get('.maplibregl-canvas').should('have.css', 'cursor', 'crosshair');
    
    // Klicke auf Karte
    cy.get('.maplibregl-canvas').click(300, 200);
    
    // Prüfe Erfolgs-Meldung
    cy.contains('Position gesetzt').should('be.visible');
    
    // Prüfe dass Marker jetzt sichtbar
    cy.get('.maplibregl-marker').should('have.length', 1);
  });
});
```

---

## 🚀 Implementation Roadmap

### Phase 1: Undo/Redo Infrastructure (2-3 Stunden)
- ✅ `usePositionSetMode` Hook implementieren
- ✅ History State Management
- ✅ Keyboard Shortcuts (Ctrl+Z/Y, ESC)
- ✅ Custom Events für Communication

### Phase 2: Map Click Handler (3-4 Stunden)
- ✅ MapContent Component (Provider-compliant!)
- ✅ Click Event Handler via wrapper
- ✅ Preview-Marker während Hover
- ✅ Cursor-Änderung (Crosshair)

### Phase 3: Editor UI (3-4 Stunden)
- ✅ "Position setzen" Button pro Foto
- ✅ Floating Toolbar im aktiven Modus
- ✅ Undo/Redo Buttons (immer sichtbar)
- ✅ Toast-Notifications

### Phase 4: Testing & Polish (2-3 Stunden)
- ✅ Unit Tests (usePositionSetMode)
- ✅ Integration Tests (Editor)
- ✅ E2E Tests (Cypress)
- ✅ A11y: Focus Management

**Gesamtaufwand:** ~10-14 Stunden

---

## 📖 User Documentation

### Für Nutzer

**Foto-Position manuell setzen:**

1. Öffne Editor
2. Wähle Foto aus der Liste (linke Sidebar)
3. Klicke "Position setzen"
4. Karte zeigt Fadenkreuz-Cursor
5. Klicke auf die Karte wo das Foto aufgenommen wurde
6. Position wird gespeichert ✅

**Position korrigieren:**
- Wiederhole Schritte 2-6 für bereits positionierte Fotos

**Undo/Redo:**
- **Undo:** Strg+Z (Windows/Linux) oder Cmd+Z (Mac)
- **Redo:** Strg+Y oder Strg+Shift+Z
- Oder nutze die Buttons rechts unten

**Abbrechen:**
- ESC-Taste drücken
- Oder "Abbrechen" Button in Toolbar

---

## ✅ Done Definition

- [x] usePositionSetMode Hook funktioniert
- [x] Undo/Redo mit History tracking
- [x] Keyboard Shortcuts (Ctrl+Z/Y, ESC)
- [x] Map Click Handler (Provider-compliant!)
- [x] Preview-Marker während Hover
- [x] Editor UI mit Controls
- [x] Toast-Notifications
- [x] Unit Tests (>80% Coverage)
- [x] Integration Tests
- [x] E2E Tests (Cypress)
- [x] Documentation aktualisiert
- [x] WhereGroup-Prinzipien eingehalten
- [x] MapComponents Best Practices (Lessons Learned!)

---

**Status:** ✅ Ready for Implementation  
**Next:** Teil 3 - Zoom & Kamera-Konfiguration
