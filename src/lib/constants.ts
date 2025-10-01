/**
 * MapTelling Constants
 * 
 * ✅ WhereGroup-Prinzip: Configuration over Code
 * 
 * @version 2.0
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
 * Default Kamera-Einstellungen
 */
export const DEFAULT_CAMERA = {
  zoom: 14,
  bearing: 0,
  pitch: 0,
  duration: 2000,
  easing: 'easeInOut' as const
};

/**
 * Upload Limits
 */
export const UPLOAD_LIMITS = {
  maxSizeMB: 10,
  maxFiles: 50,
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp']
};

/**
 * Thumbnail Settings
 */
export const THUMBNAIL_SETTINGS = {
  size: 400,
  quality: 0.7,
  previewSize: 800,
  previewQuality: 0.8
};

/**
 * Map Settings
 */
export const MAP_SETTINGS = {
  maxZoom: 18,
  minZoom: 1,
  defaultZoom: 10
};

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
};

/**
 * Animation Durations
 */
export const ANIMATION = {
  cameraFly: 2000,
  uiFade: 300,
  cardSlide: 400
};

/**
 * Layer IDs (mit Namespace)
 */
export const LAYER_IDS = {
  wmsBackground: 'wms-background',
  photoMarkers: 'maptelling-photo-markers',
  photoMarkersGlow: 'maptelling-photo-markers-glow',
  photoLabels: 'maptelling-photo-labels'
};

/**
 * Source IDs (mit Namespace)
 */
export const SOURCE_IDS = {
  wms: 'wms-wheregroup',
  photos: 'maptelling-photos'
};
