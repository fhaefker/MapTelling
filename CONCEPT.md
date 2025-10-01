# MapTelling - Konzeptdokument
## Foto-basierte Scroll-Story auf interaktiver Karte

**Version:** 1.0  
**Datum:** 1. Oktober 2025  
**Status:** Ready for Implementation

---

## 🎯 Executive Summary

MapTelling ist eine Webanwendung, die Foto-Storytelling mit interaktiver Kartografie verbindet. Nutzer laden Fotos hoch, weisen ihnen Positionen zu und erstellen scrollbare Geschichten. Beim Scrollen navigiert die Karte automatisch zu den Foto-Standorten.

### Kern-Features
- 📸 Foto-Upload mit EXIF-Metadaten-Extraktion
- 🗺️ Automatische GPS-Positionierung oder manuelle Platzierung
- ✍️ Text-Annotationen pro Foto
- 📜 Scroll-synchronisierte Karten-Navigation
- 💾 Persistente lokale Speicherung (IndexedDB + LocalStorage)
- 📤 JSON-Export für Sharing

---

## 📐 WhereGroup-Prinzipien & MapComponents-Regeln

### ✅ Configuration over Code
```yaml
Umsetzung:
  - Story als JSON-Konfiguration (GeoJSON FeatureCollection)
  - Deklarative MapLibre Style JSON für Basemap
  - Kamera-Animationen über Properties (nicht imperativer Code)
  - Component-Props statt Hardcoding
```

### ✅ Standards-driven
```yaml
Standards:
  - GeoJSON (OGC) für Geometrien
  - EXIF (ISO) für Foto-Metadaten
  - ISO 8601 für Zeitstempel
  - Web Storage API (W3C)
  - PWA Manifest (W3C)
```

### ✅ Open Source First
```yaml
Dependencies:
  - @mapcomponents/react-maplibre (MIT)
  - exifreader (MIT)
  - idb (ISC)
  - Keine proprietären Libraries
```

### ✅ MapComponents Patterns
```yaml
MUST:
  - MapComponentsProvider als Root-Context
  - Hooks für Map-Zugriff (useMap, useMapState)
  - Deklarative Layer-Komponenten (MlGeoJsonLayer)
  - ComponentId-basiertes Cleanup (automatic)
  - Stable layerId/geojson References (useMemo)

AVOID:
  - Direkter map.addLayer() Aufruf (bypassed wrapper)
  - Conditional Hook calls
  - Unstable auto-generated IDs
  - Imperative Map-Manipulation wo declarative möglich
```

### ✅ Accessibility (WCAG 2.1)
```yaml
Requirements:
  - Keyboard Navigation (Arrow Keys, Home, End, Tab)
  - ARIA Labels für alle Interaktionselemente
  - Screen Reader Announcements (aria-live)
  - Focus Indicators
  - Alt-Texte für alle Fotos
  - Reduced Motion Support (prefers-reduced-motion)
```

### ✅ Privacy by Design
```yaml
Strategy:
  - Lokale Speicherung (IndexedDB) als Default
  - Kein automatischer Server-Upload
  - Export-Kontrolle beim Nutzer
  - Keine Tracking-Cookies
  - Optionale Server-Synchronisation
```

---

## 🏗️ Architektur

### Komponenten-Hierarchie

```
src/
├── App.tsx                          # Root mit Router
├── index.css                        # Global Styles
│
├── components/
│   ├── map/                         # MapComponents Integration
│   │   ├── MapProvider.tsx         # MapComponentsProvider Wrapper
│   │   ├── StoryMap.tsx            # MapLibreMap + Layers
│   │   └── PhotoMarkerLayer.tsx   # Custom MlPhotoMarkerLayer
│   │
│   ├── editor/                      # Story Creation
│   │   ├── PhotoUploader.tsx      # Drag & Drop + EXIF
│   │   ├── PhotoList.tsx          # Sortable List
│   │   ├── PhotoEditor.tsx        # Text + Position Editor
│   │   ├── MapClickHandler.tsx    # Manual Placement Tool
│   │   └── StoryExporter.tsx      # JSON Export
│   │
│   ├── viewer/                      # Story Consumption
│   │   ├── StoryViewer.tsx        # Main Layout
│   │   ├── StoryPanel.tsx         # Sidebar mit Fotos
│   │   ├── PhotoCard.tsx          # Einzelne Story-Station
│   │   └── ScrollController.tsx   # Intersection Observer
│   │
│   └── shared/                      # Reusable
│       ├── LoadingSpinner.tsx
│       ├── ErrorBoundary.tsx
│       └── ConfirmDialog.tsx
│
├── hooks/
│   ├── usePhotoUpload.ts           # Upload + EXIF Logic
│   ├── usePhotoStorage.ts          # IndexedDB Wrapper
│   ├── useStoryState.ts            # Story State Management
│   ├── useScrollSync.ts            # Scroll ↔ Map Sync
│   ├── useExifParser.ts            # EXIF GPS Extraction
│   ├── useCameraAnimation.ts       # MapLibre flyTo Wrapper
│   └── useKeyboardNav.ts           # Accessibility Navigation
│
├── lib/
│   ├── storage.ts                  # IndexedDB + LocalStorage API
│   ├── exif-utils.ts               # EXIF Helpers (DMS → DD)
│   ├── geojson-utils.ts            # GeoJSON Generators
│   ├── thumbnail.ts                # Image Compression
│   └── constants.ts                # App-wide Constants
│
└── types/
    ├── story.ts                    # TypeScript Interfaces
    ├── photo.ts
    └── exif.ts
```

---

## 📊 Datenmodell (TypeScript)

### Core Interfaces

```typescript
// types/story.ts

/**
 * Photo Story als GeoJSON FeatureCollection
 * Standard: OGC GeoJSON (RFC 7946)
 */
export interface PhotoStory {
  type: "FeatureCollection";
  features: PhotoFeature[];
  metadata: StoryMetadata;
}

export interface StoryMetadata {
  id: string;                    // UUID
  title: string;
  description?: string;
  author?: string;
  created: string;               // ISO 8601
  updated: string;               // ISO 8601
  version: "1.0";
}

export interface PhotoFeature {
  type: "Feature";
  geometry: {
    type: "Point";
    coordinates: [number, number]; // [lng, lat]
  };
  properties: PhotoProperties;
}

export interface PhotoProperties {
  // Identifikation
  id: string;                    // UUID
  order: number;                 // Reihenfolge in Story (0-based)
  
  // Media
  photoId: string;               // IndexedDB Key
  thumbnailUrl: string;          // Data URL (klein, ~200px)
  photoUrl?: string;             // Data URL (full size, optional)
  
  // Content
  title: string;
  description: string;           // Markdown-fähig
  timestamp: string;             // ISO 8601
  
  // Kamera-Animation Settings
  camera: CameraSettings;
  
  // EXIF Metadaten (optional)
  exif?: ExifData;
  
  // Position Source
  positionSource: "exif" | "manual";
}

export interface CameraSettings {
  zoom: number;                  // 1-22 (empfohlen: 12-15 für "mittlere Nähe")
  bearing?: number;              // 0-360 Grad
  pitch?: number;                // 0-60 Grad
  duration?: number;             // Animation ms (default: 2000)
  easing?: "linear" | "easeInOut" | "easeOut"; // default: "easeInOut"
}

export interface ExifData {
  camera?: string;               // z.B. "Canon EOS R5"
  lens?: string;
  dateTime?: string;             // Original EXIF DateTime
  gpsAltitude?: number;          // Meter
  gpsAccuracy?: number;          // Meter
  orientation?: number;          // 1-8 (EXIF Orientation)
  focalLength?: number;
  aperture?: number;
  shutterSpeed?: string;
  iso?: number;
}

// types/photo.ts

export interface PhotoFile {
  id: string;
  data: ArrayBuffer;
  type: string;                  // MIME type
  name: string;
  size: number;
  created: string;               // ISO 8601
}

export interface PhotoUploadResult {
  id: string;
  thumbnailUrl: string;
  coordinates: [number, number] | null;
  exif: ExifData | null;
  error?: string;
}
```

---

## 🔧 Hooks Implementation Guidelines

### 1. usePhotoUpload

```typescript
// hooks/usePhotoUpload.ts

import { useState, useCallback } from 'react';
import { parseExif } from '../lib/exif-utils';
import { createThumbnail } from '../lib/thumbnail';
import { PhotoStorage } from '../lib/storage';

interface UsePhotoUploadOptions {
  maxSizeMB?: number;              // default: 10
  thumbnailSize?: number;          // default: 400
  onSuccess?: (result: PhotoUploadResult) => void;
  onError?: (error: Error) => void;
}

export const usePhotoUpload = (options: UsePhotoUploadOptions = {}) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  
  const uploadPhoto = useCallback(async (file: File) => {
    setUploading(true);
    setProgress(0);
    
    try {
      // 1. Validierung
      if (file.size > (options.maxSizeMB || 10) * 1024 * 1024) {
        throw new Error(`Datei zu groß (max ${options.maxSizeMB}MB)`);
      }
      
      setProgress(20);
      
      // 2. EXIF Extraktion
      const exif = await parseExif(file);
      const coordinates = exif?.gps || null;
      
      setProgress(40);
      
      // 3. Thumbnail generieren
      const thumbnailUrl = await createThumbnail(
        file, 
        options.thumbnailSize || 400
      );
      
      setProgress(60);
      
      // 4. In IndexedDB speichern
      const photoId = await PhotoStorage.store(file);
      
      setProgress(80);
      
      const result: PhotoUploadResult = {
        id: photoId,
        thumbnailUrl,
        coordinates,
        exif: exif || null
      };
      
      setProgress(100);
      options.onSuccess?.(result);
      
      return result;
      
    } catch (error) {
      options.onError?.(error as Error);
      throw error;
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(0), 500);
    }
  }, [options]);
  
  return {
    uploadPhoto,
    uploading,
    progress
  };
};
```

### 2. useScrollSync

```typescript
// hooks/useScrollSync.ts

import { useEffect, useRef } from 'react';
import { useMap } from '@mapcomponents/react-maplibre';
import type { PhotoFeature } from '../types/story';

interface UseScrollSyncOptions {
  mapId: string;
  photos: PhotoFeature[];
  activeIndex: number;
  onPhotoChange: (index: number) => void;
  threshold?: number;              // default: 0.5
  rootMargin?: string;             // default: '-20% 0px'
}

export const useScrollSync = ({
  mapId,
  photos,
  activeIndex,
  onPhotoChange,
  threshold = 0.5,
  rootMargin = '-20% 0px'
}: UseScrollSyncOptions) => {
  const { map, mapIsReady } = useMap({ mapId });
  const observerRef = useRef<IntersectionObserver | null>(null);
  const isManualScroll = useRef(false);
  
  // Intersection Observer Setup
  useEffect(() => {
    if (!mapIsReady || photos.length === 0) return;
    
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && !isManualScroll.current) {
            const index = parseInt(entry.target.getAttribute('data-index') || '0');
            const photo = photos[index];
            
            if (!photo) return;
            
            // MapLibre flyTo Animation
            map?.map.flyTo({
              center: photo.geometry.coordinates,
              zoom: photo.properties.camera.zoom,
              bearing: photo.properties.camera.bearing || 0,
              pitch: photo.properties.camera.pitch || 0,
              duration: photo.properties.camera.duration || 2000,
              essential: true // Respektiert prefers-reduced-motion
            });
            
            onPhotoChange(index);
          }
        });
      },
      { threshold, rootMargin }
    );
    
    // Alle Photo Cards beobachten
    const cards = document.querySelectorAll('[data-photo-card]');
    cards.forEach(card => observerRef.current?.observe(card));
    
    return () => {
      observerRef.current?.disconnect();
    };
  }, [mapIsReady, photos, onPhotoChange, threshold, rootMargin, map]);
  
  // Programmatisches Scrollen (von Map-Click)
  const scrollToPhoto = useCallback((index: number) => {
    const card = document.querySelector(`[data-index="${index}"]`);
    if (card) {
      isManualScroll.current = true;
      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => { isManualScroll.current = false; }, 1000);
    }
  }, []);
  
  return { scrollToPhoto };
};
```

### 3. useExifParser

```typescript
// hooks/useExifParser.ts

import { useState, useCallback } from 'react';
import ExifReader from 'exifreader';
import { convertDMSToDD } from '../lib/exif-utils';
import type { ExifData } from '../types/photo';

export const useExifParser = () => {
  const [parsing, setParsing] = useState(false);
  
  const parseExif = useCallback(async (file: File): Promise<{
    gps: [number, number] | null;
    exif: ExifData | null;
  }> => {
    setParsing(true);
    
    try {
      const tags = await ExifReader.load(file);
      
      // GPS-Koordinaten extrahieren
      let gps: [number, number] | null = null;
      if (tags.GPSLatitude && tags.GPSLongitude) {
        const lat = convertDMSToDD(tags.GPSLatitude.description);
        const lng = convertDMSToDD(tags.GPSLongitude.description);
        
        // Hemisphären berücksichtigen
        const latRef = tags.GPSLatitudeRef?.value?.[0];
        const lngRef = tags.GPSLongitudeRef?.value?.[0];
        
        gps = [
          lngRef === 'W' ? -lng : lng,
          latRef === 'S' ? -lat : lat
        ];
      }
      
      // EXIF-Metadaten extrahieren
      const exif: ExifData = {
        camera: tags.Model?.description,
        lens: tags.LensModel?.description,
        dateTime: tags.DateTime?.description,
        gpsAltitude: tags.GPSAltitude?.description,
        orientation: tags.Orientation?.value,
        focalLength: tags.FocalLength?.description,
        aperture: tags.FNumber?.description,
        shutterSpeed: tags.ExposureTime?.description,
        iso: tags.ISOSpeedRatings?.description
      };
      
      return { gps, exif };
      
    } catch (error) {
      console.warn('EXIF parsing failed:', error);
      return { gps: null, exif: null };
    } finally {
      setParsing(false);
    }
  }, []);
  
  return { parseExif, parsing };
};
```

### 4. useStoryState

```typescript
// hooks/useStoryState.ts

import { useState, useCallback, useEffect } from 'react';
import { StoryStorage } from '../lib/storage';
import type { PhotoStory, PhotoFeature, StoryMetadata } from '../types/story';

export const useStoryState = () => {
  const [story, setStory] = useState<PhotoStory | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // Load Story from LocalStorage on mount
  useEffect(() => {
    const loadStory = async () => {
      try {
        const saved = await StoryStorage.load();
        if (saved) {
          setStory(saved);
        } else {
          // Initialize empty story
          const emptyStory: PhotoStory = {
            type: "FeatureCollection",
            features: [],
            metadata: {
              id: crypto.randomUUID(),
              title: "Neue Story",
              created: new Date().toISOString(),
              updated: new Date().toISOString(),
              version: "1.0"
            }
          };
          setStory(emptyStory);
        }
      } finally {
        setLoading(false);
      }
    };
    
    loadStory();
  }, []);
  
  // Auto-save on change
  useEffect(() => {
    if (story && !loading) {
      StoryStorage.save(story);
    }
  }, [story, loading]);
  
  const addPhoto = useCallback((photo: PhotoFeature) => {
    setStory(prev => {
      if (!prev) return null;
      return {
        ...prev,
        features: [...prev.features, photo],
        metadata: {
          ...prev.metadata,
          updated: new Date().toISOString()
        }
      };
    });
  }, []);
  
  const updatePhoto = useCallback((id: string, updates: Partial<PhotoFeature>) => {
    setStory(prev => {
      if (!prev) return null;
      return {
        ...prev,
        features: prev.features.map(f => 
          f.properties.id === id 
            ? { ...f, ...updates }
            : f
        ),
        metadata: {
          ...prev.metadata,
          updated: new Date().toISOString()
        }
      };
    });
  }, []);
  
  const removePhoto = useCallback((id: string) => {
    setStory(prev => {
      if (!prev) return null;
      return {
        ...prev,
        features: prev.features.filter(f => f.properties.id !== id),
        metadata: {
          ...prev.metadata,
          updated: new Date().toISOString()
        }
      };
    });
  }, []);
  
  const reorderPhotos = useCallback((startIndex: number, endIndex: number) => {
    setStory(prev => {
      if (!prev) return null;
      
      const result = Array.from(prev.features);
      const [removed] = result.splice(startIndex, 1);
      result.splice(endIndex, 0, removed);
      
      // Update order property
      result.forEach((feature, index) => {
        feature.properties.order = index;
      });
      
      return {
        ...prev,
        features: result,
        metadata: {
          ...prev.metadata,
          updated: new Date().toISOString()
        }
      };
    });
  }, []);
  
  const updateMetadata = useCallback((updates: Partial<StoryMetadata>) => {
    setStory(prev => {
      if (!prev) return null;
      return {
        ...prev,
        metadata: {
          ...prev.metadata,
          ...updates,
          updated: new Date().toISOString()
        }
      };
    });
  }, []);
  
  return {
    story,
    activeIndex,
    setActiveIndex,
    loading,
    addPhoto,
    updatePhoto,
    removePhoto,
    reorderPhotos,
    updateMetadata
  };
};
```

---

## 🎨 Component Implementation Guidelines

### PhotoMarkerLayer (MapComponents Pattern)

```typescript
// components/map/PhotoMarkerLayer.tsx

import { useMemo } from 'react';
import { MlGeoJsonLayer } from '@mapcomponents/react-maplibre';
import type { PhotoFeature } from '../../types/story';

interface PhotoMarkerLayerProps {
  mapId: string;
  photos: PhotoFeature[];
  activeIndex: number;
  onPhotoClick?: (index: number) => void;
}

export const PhotoMarkerLayer = ({
  mapId,
  photos,
  activeIndex,
  onPhotoClick
}: PhotoMarkerLayerProps) => {
  // ✅ MUST: Stable GeoJSON reference via useMemo
  const geojson = useMemo(() => ({
    type: 'FeatureCollection' as const,
    features: photos
  }), [photos]);
  
  const activePhotoId = photos[activeIndex]?.properties.id;
  
  return (
    <>
      {/* Base Marker Circle */}
      <MlGeoJsonLayer
        mapId={mapId}
        layerId="photo-markers"
        geojson={geojson}
        options={{
          type: 'circle',
          paint: {
            'circle-radius': [
              'case',
              ['==', ['get', 'id'], activePhotoId],
              20,  // Active
              14   // Inactive
            ],
            'circle-color': [
              'case',
              ['==', ['get', 'id'], activePhotoId],
              '#FF6B35',  // WhereGroup Orange
              '#004E89'   // WhereGroup Blue
            ],
            'circle-stroke-width': 3,
            'circle-stroke-color': '#ffffff',
            'circle-opacity': 0.95
          }
        }}
        onClick={(e) => {
          if (!e.features?.[0]) return;
          const clickedId = e.features[0].properties.id;
          const index = photos.findIndex(p => p.properties.id === clickedId);
          if (index !== -1) onPhotoClick?.(index);
        }}
      />
      
      {/* Glow Effect for Active Marker */}
      <MlGeoJsonLayer
        mapId={mapId}
        layerId="photo-markers-glow"
        geojson={geojson}
        options={{
          type: 'circle',
          paint: {
            'circle-radius': 35,
            'circle-color': '#FF6B35',
            'circle-opacity': [
              'case',
              ['==', ['get', 'id'], activePhotoId],
              0.3,
              0
            ],
            'circle-blur': 1.5
          }
        }}
      />
      
      {/* Number Labels */}
      <MlGeoJsonLayer
        mapId={mapId}
        layerId="photo-labels"
        geojson={geojson}
        options={{
          type: 'symbol',
          layout: {
            'text-field': ['get', 'order'],
            'text-size': 14,
            'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold']
          },
          paint: {
            'text-color': '#ffffff'
          }
        }}
      />
    </>
  );
};
```

### StoryViewer Layout

```typescript
// components/viewer/StoryViewer.tsx

import { MapComponentsProvider, MapLibreMap } from '@mapcomponents/react-maplibre';
import { PhotoMarkerLayer } from '../map/PhotoMarkerLayer';
import { StoryPanel } from './StoryPanel';
import { useScrollSync } from '../../hooks/useScrollSync';
import { useStoryState } from '../../hooks/useStoryState';
import { useKeyboardNav } from '../../hooks/useKeyboardNav';

export const StoryViewer = () => {
  const { story, activeIndex, setActiveIndex } = useStoryState();
  
  const { scrollToPhoto } = useScrollSync({
    mapId: 'main',
    photos: story?.features || [],
    activeIndex,
    onPhotoChange: setActiveIndex
  });
  
  // ✅ Accessibility: Keyboard Navigation
  useKeyboardNav({
    total: story?.features.length || 0,
    activeIndex,
    onNavigate: scrollToPhoto
  });
  
  if (!story) return <div>Loading...</div>;
  
  const initialCenter = story.features[0]?.geometry.coordinates || [7.1, 50.73];
  
  return (
    <div className="story-viewer">
      {/* Left Sidebar: Scrollable Photos */}
      <StoryPanel
        photos={story.features}
        activeIndex={activeIndex}
        onPhotoClick={scrollToPhoto}
      />
      
      {/* Right: Fullscreen Map */}
      <MapComponentsProvider>
        <MapLibreMap
          mapId="main"
          options={{
            style: {
              version: 8,
              sources: {
                'osm-tiles': {
                  type: 'raster',
                  tiles: ['https://osm-demo.wheregroup.com/tiles/{z}/{x}/{y}.png'],
                  tileSize: 256,
                  attribution: '© OpenStreetMap contributors'
                }
              },
              layers: [{
                id: 'osm-background',
                type: 'raster',
                source: 'osm-tiles'
              }]
            },
            center: initialCenter,
            zoom: 10,
            attributionControl: true
          }}
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: 0,
            right: 0
          }}
        />
        
        <PhotoMarkerLayer
          mapId="main"
          photos={story.features}
          activeIndex={activeIndex}
          onPhotoClick={scrollToPhoto}
        />
      </MapComponentsProvider>
    </div>
  );
};
```

---

## 💾 Storage Implementation

```typescript
// lib/storage.ts

import { openDB, type IDBPDatabase } from 'idb';
import type { PhotoStory, PhotoFile } from '../types';

const DB_NAME = 'MapTelling';
const DB_VERSION = 1;

// IndexedDB für Fotos (große Binärdaten)
export class PhotoStorage {
  private static db: IDBPDatabase | null = null;
  
  private static async getDB() {
    if (!this.db) {
      this.db = await openDB(DB_NAME, DB_VERSION, {
        upgrade(db) {
          if (!db.objectStoreNames.contains('photos')) {
            db.createObjectStore('photos', { keyPath: 'id' });
          }
        }
      });
    }
    return this.db;
  }
  
  static async store(file: File): Promise<string> {
    const db = await this.getDB();
    const id = crypto.randomUUID();
    const arrayBuffer = await file.arrayBuffer();
    
    const photoFile: PhotoFile = {
      id,
      data: arrayBuffer,
      type: file.type,
      name: file.name,
      size: file.size,
      created: new Date().toISOString()
    };
    
    await db.put('photos', photoFile);
    return id;
  }
  
  static async get(id: string): Promise<Blob | null> {
    const db = await this.getDB();
    const photo = await db.get('photos', id);
    
    if (!photo) return null;
    
    return new Blob([photo.data], { type: photo.type });
  }
  
  static async delete(id: string): Promise<void> {
    const db = await this.getDB();
    await db.delete('photos', id);
  }
  
  static async getAll(): Promise<PhotoFile[]> {
    const db = await this.getDB();
    return db.getAll('photos');
  }
}

// LocalStorage für Story-Konfiguration (klein, JSON)
export class StoryStorage {
  private static STORAGE_KEY = 'maptelling-current-story';
  
  static save(story: PhotoStory): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(story));
    } catch (error) {
      console.error('Failed to save story:', error);
      // Fallback: Quota exceeded → Warnung anzeigen
    }
  }
  
  static load(): PhotoStory | null {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Failed to load story:', error);
      return null;
    }
  }
  
  static clear(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }
  
  // Export als downloadbare Datei
  static async export(story: PhotoStory): Promise<void> {
    // Fotos als Base64 einbetten
    const exportData = {
      ...story,
      features: await Promise.all(
        story.features.map(async (feature) => {
          const blob = await PhotoStorage.get(feature.properties.photoId);
          if (!blob) return feature;
          
          const dataUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
          
          return {
            ...feature,
            properties: {
              ...feature.properties,
              photoUrl: dataUrl
            }
          };
        })
      )
    };
    
    const blob = new Blob(
      [JSON.stringify(exportData, null, 2)],
      { type: 'application/json' }
    );
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${story.metadata.title.replace(/\s+/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
```

---

## 🎨 Styling Guidelines

### CSS Architecture

```css
/* src/index.css */

/* ✅ WhereGroup Color Palette */
:root {
  --wg-blue-primary: #004E89;
  --wg-blue-light: #006BA6;
  --wg-orange: #FF6B35;
  --wg-yellow: #F7931E;
  --wg-gray-dark: #333333;
  --wg-gray-medium: #666666;
  --wg-gray-light: #CCCCCC;
  --wg-white: #FFFFFF;
  
  --transition-smooth: cubic-bezier(0.4, 0, 0.2, 1);
  --shadow-medium: 0 4px 6px rgba(0, 0, 0, 0.1);
}

/* ✅ Accessibility: Reduced Motion Support */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}

/* Layout: Fullscreen */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body, #root {
  width: 100%;
  height: 100%;
  overflow: hidden;
  font-family: 'Inter', 'Open Sans', system-ui, -apple-system, sans-serif;
}

/* Story Viewer Grid */
.story-viewer {
  display: grid;
  grid-template-columns: 400px 1fr;
  height: 100vh;
}

@media (max-width: 768px) {
  .story-viewer {
    grid-template-columns: 1fr;
    grid-template-rows: 50vh 50vh;
  }
}

/* Story Panel (Sidebar) */
.story-panel {
  overflow-y: auto;
  background: var(--wg-white);
  border-right: 1px solid var(--wg-gray-light);
  scroll-behavior: smooth;
}

/* Photo Card */
.photo-card {
  padding: 1.5rem;
  border-bottom: 1px solid var(--wg-gray-light);
  transition: background-color 0.3s var(--transition-smooth);
}

.photo-card.active {
  background-color: rgba(255, 107, 53, 0.1);
  border-left: 4px solid var(--wg-orange);
}

.photo-card img {
  width: 100%;
  border-radius: 8px;
  box-shadow: var(--shadow-medium);
}

/* ✅ Accessibility: Focus Indicators */
.photo-card:focus-within {
  outline: 3px solid var(--wg-orange);
  outline-offset: 2px;
}

button:focus-visible {
  outline: 3px solid var(--wg-orange);
  outline-offset: 2px;
}

/* Loading States */
.loading-spinner {
  border: 4px solid var(--wg-gray-light);
  border-top-color: var(--wg-orange);
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
```

---

## 🧪 Testing Strategy

### Unit Tests (Vitest)

```typescript
// hooks/__tests__/useExifParser.test.ts

import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useExifParser } from '../useExifParser';

describe('useExifParser', () => {
  it('should extract GPS coordinates from EXIF', async () => {
    const { result } = renderHook(() => useExifParser());
    
    // Mock File mit EXIF
    const mockFile = new File([''], 'test.jpg', { type: 'image/jpeg' });
    
    const { gps } = await result.current.parseExif(mockFile);
    
    expect(gps).toBeInstanceOf(Array);
    expect(gps).toHaveLength(2);
  });
});
```

### E2E Tests (Cypress)

```typescript
// cypress/e2e/story-viewer.cy.ts

describe('Story Viewer', () => {
  beforeEach(() => {
    cy.visit('/');
  });
  
  it('should scroll through story and animate map', () => {
    // Upload Photos
    cy.get('[data-testid="photo-upload"]').attachFile('test-photo.jpg');
    cy.wait(1000);
    
    // Switch to Viewer
    cy.get('[data-testid="view-story-btn"]').click();
    
    // Scroll to second photo
    cy.get('[data-index="1"]').scrollIntoView();
    
    // Map should animate
    cy.wait(2000);
    cy.window().then((win) => {
      const map = (win as any).maplibreMap;
      expect(map.getZoom()).to.be.greaterThan(10);
    });
  });
  
  // ✅ Accessibility Test
  it('should navigate with keyboard', () => {
    cy.get('body').type('{downarrow}');
    cy.get('[data-index="1"]').should('be.visible');
    
    cy.get('body').type('{uparrow}');
    cy.get('[data-index="0"]').should('be.visible');
  });
});
```

---

## 📦 Dependencies (package.json)

```json
{
  "name": "maptelling",
  "version": "1.0.0",
  "private": false,
  "license": "MIT",
  "homepage": "https://fhaefker.github.io/MapTelling",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:e2e": "cypress run",
    "lint": "eslint src --ext ts,tsx"
  },
  "dependencies": {
    "@mapcomponents/react-maplibre": "^1.6.0",
    "react": "^19.1.1",
    "react-dom": "^19.1.1",
    "exifreader": "^4.23.0",
    "idb": "^8.0.0",
    "browser-image-compression": "^2.0.2"
  },
  "devDependencies": {
    "@types/react": "^19.1.13",
    "@types/react-dom": "^19.1.9",
    "@typescript-eslint/eslint-plugin": "^8.43.0",
    "@typescript-eslint/parser": "^8.43.0",
    "@vitejs/plugin-react": "^5.0.2",
    "cypress": "^13.15.2",
    "eslint": "^9.35.0",
    "typescript": "^5.9.2",
    "vite": "^7.1.5",
    "vitest": "^2.1.8"
  }
}
```

---

## 🚀 Implementation Roadmap

### Phase 1: Foundation (Week 1)
```
✅ Setup
  - Branch: feat/photo-story-foundation
  - Dependencies installieren
  - TypeScript Interfaces definieren
  - Storage Layer implementieren

✅ Core Upload
  - PhotoUploader Component
  - EXIF Parser Hook
  - IndexedDB Integration
  - Thumbnail Generator

✅ Basic Viewer
  - StoryViewer Layout
  - PhotoCard Component
  - MapLibreMap Integration
```

### Phase 2: Map Interaction (Week 2)
```
✅ Photo Markers
  - PhotoMarkerLayer Component
  - Active State Styling
  - Click Handler

✅ Scroll Sync
  - useScrollSync Hook
  - Intersection Observer
  - MapLibre flyTo Integration

✅ Manual Placement
  - Map Click Handler
  - Coordinate Picker UI
  - Position Override
```

### Phase 3: Editor Features (Week 3)
```
✅ Text Editor
  - Rich Text Input (optional Markdown)
  - Title + Description
  - Auto-save

✅ Reordering
  - Drag & Drop List
  - Order Updates
  - Camera Settings Editor

✅ Export/Import
  - JSON Export
  - Data URL Embedding
  - Import Validation
```

### Phase 4: Polish & Accessibility (Week 4)
```
✅ Keyboard Navigation
  - Arrow Keys
  - Home/End
  - Tab Focus Management

✅ Accessibility
  - ARIA Labels
  - Screen Reader Support
  - Focus Indicators

✅ Performance
  - Lazy Loading
  - Thumbnail Optimization
  - Animation Debouncing

✅ Documentation
  - User Guide
  - Developer Docs
  - Deployment
```

---

## 📝 Development Commands

```bash
# Setup
git checkout -b feat/photo-story-mvp
npm install

# Development
npm run dev                    # http://localhost:5173

# Testing
npm test                       # Unit tests (watch mode)
npm run test:e2e               # Cypress E2E

# Build & Deploy
npm run build                  # Production build
npm run preview                # Test production build
git push origin feat/photo-story-mvp  # Deploy via GitHub Actions
```

---

## 🔒 Security & Privacy Checklist

```yaml
Data Storage:
  ✅ IndexedDB für lokale Fotos (kein Server)
  ✅ LocalStorage für Story-Config
  ✅ Kein automatischer Upload
  ✅ Export nur auf User-Aktion

EXIF Data:
  ✅ GPS-Extraktion opt-in (User sieht Preview)
  ✅ Sensitive Metadaten filtern (z.B. Seriennummern)
  ✅ User kann Position überschreiben

Input Validation:
  ✅ File Size Limit (10MB default)
  ✅ MIME Type Check (image/*)
  ✅ Malformed EXIF Handling (try/catch)

Content Security:
  ✅ No eval() or innerHTML
  ✅ Sanitize User Text (XSS prevention)
  ✅ CSP Headers (Vite config)
```

---

## 📚 References & Resources

### MapComponents Documentation
- Main Docs: https://mapcomponents.github.io/mapcomponents/storybook-composition/
- React MapLibre: https://mapcomponents.github.io/mapcomponents/react-maplibre/
- Catalogue: https://www.mapcomponents.org/

### Standards
- GeoJSON: https://tools.ietf.org/html/rfc7946
- EXIF: https://www.exif.org/specifications.html
- WCAG 2.1: https://www.w3.org/WAI/WCAG21/quickref/

### Libraries
- exifreader: https://github.com/mattiasw/ExifReader
- idb: https://github.com/jakearchibald/idb
- MapLibre: https://maplibre.org/maplibre-gl-js/docs/

---

## ✅ Implementation Checklist

Vor jedem Commit prüfen:

```
Code Quality:
  ☐ TypeScript strict mode (keine any)
  ☐ ESLint clean (0 errors, 0 warnings)
  ☐ Komponenten dokumentiert (JSDoc)
  ☐ Performance: useMemo für GeoJSON
  ☐ Cleanup: useEffect returns cleanup functions

MapComponents Compliance:
  ☐ MapComponentsProvider als Root
  ☐ useMap Hook für Map-Zugriff
  ☐ MlGeoJsonLayer für Marker (nicht map.addLayer)
  ☐ Stable layerId/geojson references
  ☐ No conditional hooks

WhereGroup Principles:
  ☐ Configuration over Code (JSON-driven)
  ☐ Standards-compliant (GeoJSON, EXIF)
  ☐ Open Source dependencies only
  ☐ Privacy by Design (local-first)

Accessibility:
  ☐ Keyboard Navigation funktioniert
  ☐ ARIA Labels vorhanden
  ☐ Focus Indicators sichtbar
  ☐ Alt-Texte für Fotos
  ☐ prefers-reduced-motion respektiert

Testing:
  ☐ Unit Tests für Hooks
  ☐ E2E Test für Happy Path
  ☐ Manual Test: Upload → Scroll → Export
```

---

**Ready for Implementation!** 🚀

Dieses Dokument enthält alle notwendigen Informationen für die vollständige Umsetzung von MapTelling im Einklang mit MapComponents und WhereGroup-Prinzipien.

Bei Fragen oder Unklarheiten: Referenziere relevante Abschnitte dieses Dokuments.
