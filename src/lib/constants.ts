/**
 * MapTelling Constants
 * 
 * ✅ WhereGroup-Prinzip: Configuration over Code
 * ✅ MapComponents-Pattern: Namespace-Prefix
 * 
 * @version 2.1
 */

/**
 * WhereGroup WMS Demo Service
 * 
 * ✅ Eigene Services nutzen
 * ✅ OGC WMS Standard zeigen
 */
export const WHEREGROUP_WMS_URL =
  'https://osm-demo.wheregroup.com/service?' +
  'SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&' +
  'FORMAT=image%2Fpng&TRANSPARENT=true&' +
  'LAYERS=osm&CRS=EPSG%3A3857&STYLES=&' +
  'WIDTH=256&HEIGHT=256&BBOX={bbox-epsg-3857}';

/**
 * WhereGroup HQ Koordinaten (Bonn)
 */
export const WHEREGROUP_HQ: [number, number] = [7.1, 50.73];

/**
 * WhereGroup Color Palette
 */
export const WHEREGROUP_COLORS = {
  blue: {
    primary: '#004E89',
    light: '#006BA6'
  },
  orange: '#FF6B35',
  yellow: '#F7931E',
  gray: {
    dark: '#333333',
    medium: '#666666',
    light: '#CCCCCC'
  },
  white: '#FFFFFF'
} as const;

/**
 * Default Kamera-Einstellungen
 */
export const DEFAULT_CAMERA = {
  zoom: 14,
  bearing: 0,
  pitch: 0,
  duration: 2000,
  easing: 'easeInOut' as const
} as const;

/**
 * Upload Limits
 */
export const UPLOAD_LIMITS = {
  maxSizeMB: 10,
  maxFiles: 50,
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp']
} as const;

/**
 * Thumbnail Settings
 */
export const THUMBNAIL_SETTINGS = {
  size: 400,
  quality: 0.8,
  maxSizeMB: 1
} as const;

/**
 * Map Settings
 */
export const MAP_SETTINGS = {
  mapId: 'main',
  minZoom: 1,
  maxZoom: 18,
  defaultZoom: 10
} as const;

/**
 * Animation Durations (ms)
 */
export const ANIMATION = {
  cameraFly: 2000,
  uiFade: 300,
  cardSlide: 400
} as const;

/**
 * Layer IDs (mit "maptelling-" Namespace-Prefix)
 * 
 * ✅ MapComponents-Pattern: Verhindert ID-Kollisionen
 */
export const LAYER_IDS = {
  // WMS Basemap
  wmsSource: 'maptelling-wms-source',
  wmsLayer: 'maptelling-wms-layer',
  
  // Photo Markers
  photoSource: 'maptelling-photo-source',
  photoMarkersLayer: 'maptelling-photo-markers',
  photoMarkersGlowLayer: 'maptelling-photo-markers-glow',
  photoLabelsLayer: 'maptelling-photo-labels',
  
  // Active State (Highlight)
  activePhotoLayer: 'maptelling-active-photo',
  activePhotoHaloLayer: 'maptelling-active-photo-halo'
} as const;

/**
 * Accessibility Settings
 */
export const ACCESSIBILITY = {
  reducedMotionDuration: 0,
  focusOutlineWidth: 2,
  minTouchTarget: 44  // px (WCAG 2.1 Level AA)
} as const;
