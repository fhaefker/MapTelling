/**
 * GPS Constants & Validation Rules
 * 
 * ✅ WhereGroup: Standards-driven (WGS84, EPSG:4326)
 * ✅ MapComponents: GeoJSON RFC 7946 compliant
 * 
 * @module utils/gpsConstants
 */

// ========================================
// COORDINATE BOUNDS (WGS84)
// ========================================

export const GPS_BOUNDS = {
  /** Minimale Latitude (Südpol) */
  LAT_MIN: -90,
  
  /** Maximale Latitude (Nordpol) */
  LAT_MAX: 90,
  
  /** Minimale Longitude (Westlich von Greenwich) */
  LNG_MIN: -180,
  
  /** Maximale Longitude (Östlich von Greenwich) */
  LNG_MAX: 180
} as const;

// ========================================
// ALTITUDE LIMITS (Plausibilitätsprüfung)
// ========================================

export const ALTITUDE_LIMITS = {
  /** Mount Everest Höhe (8849m) */
  MAX: 8850,
  
  /** Totes Meer (~-430m) */
  MIN: -500,
  
  /** Marianengraben für Unterwasser-Aufnahmen (-11034m) */
  ABSOLUTE_MIN: -11100
} as const;

// ========================================
// ACCURACY THRESHOLDS
// ========================================

export const GPS_ACCURACY = {
  /** Exzellent: <10m (Smartphone mit A-GPS) */
  EXCELLENT: 10,
  
  /** Gut: <50m (Normaler GPS-Empfang) */
  GOOD: 50,
  
  /** Akzeptabel: <200m */
  ACCEPTABLE: 200,
  
  /** Warnung: >1000m (schlechter Empfang) */
  WARNING: 1000
} as const;

// ========================================
// SPECIAL COORDINATES
// ========================================

export const SPECIAL_COORDS = {
  /** Null Island (0, 0) - Häufiger EXIF-Fehler */
  NULL_ISLAND: { lat: 0, lng: 0 },
  
  /** WhereGroup HQ Bonn (Fallback-Position) */
  WHEREGROUP_HQ: { lat: 50.73, lng: 7.1 }
} as const;

// ========================================
// VALIDATION MESSAGES (Deutsch)
// ========================================

export const GPS_VALIDATION_MESSAGES = {
  NULL_ISLAND: 'Koordinaten sind (0, 0) - wahrscheinlich ungültige GPS-Daten',
  ALTITUDE_TOO_HIGH: 'Höhe über Mount Everest - wahrscheinlich ungültig',
  ALTITUDE_TOO_LOW: 'Höhe unter Meeresspiegel-Limit - wahrscheinlich ungültig',
  LOW_ACCURACY: (accuracy: number) => `Niedrige GPS-Genauigkeit: ${accuracy}m`,
  OUT_OF_BOUNDS: 'Koordinaten außerhalb gültiger WGS84-Grenzen'
} as const;

// ========================================
// HELPER FUNCTIONS
// ========================================

/**
 * Check if coordinates are "Null Island" (common EXIF error)
 */
export function isNullIsland(lat: number, lng: number): boolean {
  return lat === SPECIAL_COORDS.NULL_ISLAND.lat && 
         lng === SPECIAL_COORDS.NULL_ISLAND.lng;
}

/**
 * Check if coordinates are within WGS84 bounds
 */
export function isWithinBounds(lat: number, lng: number): boolean {
  return lat >= GPS_BOUNDS.LAT_MIN &&
         lat <= GPS_BOUNDS.LAT_MAX &&
         lng >= GPS_BOUNDS.LNG_MIN &&
         lng <= GPS_BOUNDS.LNG_MAX;
}

/**
 * Check if altitude is plausible
 */
export function isPlausibleAltitude(altitude: number): boolean {
  return altitude >= ALTITUDE_LIMITS.MIN && 
         altitude <= ALTITUDE_LIMITS.MAX;
}

/**
 * Get accuracy quality level
 */
export function getAccuracyQuality(accuracy: number): 'excellent' | 'good' | 'acceptable' | 'poor' {
  if (accuracy <= GPS_ACCURACY.EXCELLENT) return 'excellent';
  if (accuracy <= GPS_ACCURACY.GOOD) return 'good';
  if (accuracy <= GPS_ACCURACY.ACCEPTABLE) return 'acceptable';
  return 'poor';
}
