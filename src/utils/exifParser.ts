/**
 * EXIF Metadata Parser
 * Extracts GPS, Camera, and Exposure data from photos
 * 
 * ✅ WhereGroup Principles:
 * - Privacy First: Lokale Verarbeitung, keine Cloud-Uploads
 * - Standards-driven: WGS84 (EPSG:4326), GeoJSON RFC 7946
 * - Transparenz: Strukturiertes Logging
 * 
 * ✅ MapComponents Compliance:
 * - GeoJSON [lng, lat] format
 * - Keine direkten Map-Zugriffe (Pure Data Processing)
 * 
 * @module utils/exifParser
 * @see CONCEPT_V2_01_GPS_POSITIONING.md
 */

import ExifReader from 'exifreader';
import { log } from './logger';
import {
  GPS_BOUNDS,
  ALTITUDE_LIMITS,
  GPS_VALIDATION_MESSAGES,
  isNullIsland,
  isWithinBounds
} from './gpsConstants';

// ========================================
// TYPES
// ========================================

export interface ExifGPSData {
  latitude: number;
  longitude: number;
  altitude?: number;
  accuracy?: number;
  timestamp?: string;
}

export interface ExifCameraData {
  make: string;
  model: string;
  lens?: string;
}

export interface ExifExposureData {
  iso?: number;
  fNumber?: number;
  exposureTime?: string;
  focalLength?: number;
}

export interface ExifMetadata {
  gps?: ExifGPSData;
  camera?: ExifCameraData;
  exposure?: ExifExposureData;
  timestamp: string;
}

// ========================================
// MAIN EXTRACTION
// ========================================

/**
 * Extract all EXIF metadata from a photo file
 * 
 * @param file - Photo file to extract metadata from
 * @returns Promise<ExifMetadata> - Extracted metadata
 * 
 * @example
 * const file = event.target.files[0];
 * const metadata = await extractExifMetadata(file);
 * if (metadata.gps) {
 *   console.log('GPS:', metadata.gps.latitude, metadata.gps.longitude);
 * }
 */
export async function extractExifMetadata(file: File): Promise<ExifMetadata> {
  try {
    const tags = await ExifReader.load(file);
    
    return {
      gps: extractGPS(tags),
      camera: extractCamera(tags),
      exposure: extractExposure(tags),
      timestamp: extractTimestamp(tags)
    };
  } catch (error) {
    log.error('exifParser', 'EXIF extraction failed', { 
      fileName: file.name, 
      error 
    });
    
    // Fallback: Minimale Metadaten zurückgeben
    return {
      timestamp: new Date().toISOString()
    };
  }
}

// ========================================
// GPS EXTRACTION
// ========================================

/**
 * Extract GPS coordinates from EXIF tags
 * 
 * ✅ WhereGroup Privacy: Keine Cloud-Uploads, nur lokale Verarbeitung
 * ✅ MapComponents: Gibt [lng, lat] Format für GeoJSON zurück
 * 
 * @param tags - ExifReader tags
 * @returns ExifGPSData | undefined
 */
function extractGPS(tags: ExifReader.Tags): ExifGPSData | undefined {
  // GPS-Daten vorhanden prüfen
  if (!tags.GPSLatitude || !tags.GPSLongitude) {
    return undefined; // ❌ Keine GPS-Daten verfügbar
  }
  
  try {
    // DMS (Degrees Minutes Seconds) → Decimal konvertieren
    const lat = convertDMSToDecimal(
      tags.GPSLatitude.description,
      tags.GPSLatitudeRef?.value?.[0] || 'N'
    );
    
    const lon = convertDMSToDecimal(
      tags.GPSLongitude.description,
      tags.GPSLongitudeRef?.value?.[0] || 'E'
    );
    
    // Koordinaten validieren
    if (!isValidCoordinate(lat, lon)) {
      log.warn('exifParser', 'Ungültige GPS-Koordinaten', { lat, lon });
      return undefined;
    }
    
    return {
      latitude: lat,
      longitude: lon,
      altitude: parseNumericValue(tags.GPSAltitude?.value),
      accuracy: parseNumericValue(tags.GPSHPositioningError?.value),
      timestamp: extractGPSTimestamp(tags)
    };
  } catch (error) {
    log.error('exifParser', 'GPS-Extraktion fehlgeschlagen', { error });
    return undefined;
  }
}

/**
 * Convert DMS (Degrees Minutes Seconds) to Decimal Degrees
 * 
 * @param dms - DMS string (e.g., "50° 43' 48.12"")
 * @param ref - Reference (N/S for latitude, E/W for longitude)
 * @returns number - Decimal degrees
 * 
 * @example
 * convertDMSToDecimal("50° 43' 48.12"", "N") // → 50.7300333
 * convertDMSToDecimal("7° 5' 58.8"", "E")   // → 7.0996666
 */
function convertDMSToDecimal(dms: string, ref: string): number {
  // Parse DMS format: "50° 43' 48.12""
  const match = dms.match(/(\d+)°\s*(\d+)'\s*([\d.]+)"/);
  
  if (!match) {
    throw new Error(`Invalid DMS format: ${dms}`);
  }
  
  const degrees = parseFloat(match[1]);
  const minutes = parseFloat(match[2]);
  const seconds = parseFloat(match[3]);
  
  // Calculate decimal
  let decimal = degrees + minutes / 60 + seconds / 3600;
  
  // Apply reference (S and W are negative)
  if (ref === 'S' || ref === 'W') {
    decimal = -decimal;
  }
  
  return decimal;
}

/**
 * GPS-Koordinaten validieren
 * 
 * @param lat - Latitude (-90 bis 90)
 * @param lon - Longitude (-180 bis 180)
 * @returns boolean
 */
function isValidCoordinate(lat: number, lon: number): boolean {
  return (
    !isNaN(lat) &&
    !isNaN(lon) &&
    isWithinBounds(lat, lon)
  );
}

/**
 * Parse numeric value from ExifReader tags
 * Handles various ExifReader return types
 */
function parseNumericValue(
  value: unknown
): number | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? undefined : parsed;
  }
  if (Array.isArray(value) && value.length > 0) {
    return typeof value[0] === 'number' ? value[0] : undefined;
  }
  return undefined;
}

/**
 * Extract GPS timestamp
 */
function extractGPSTimestamp(tags: ExifReader.Tags): string | undefined {
  if (tags.GPSDateStamp && tags.GPSTimeStamp) {
    return `${tags.GPSDateStamp.description} ${tags.GPSTimeStamp.description}`;
  }
  return undefined;
}

// ========================================
// CAMERA EXTRACTION
// ========================================

/**
 * Extract camera information
 */
function extractCamera(tags: ExifReader.Tags): ExifCameraData | undefined {
  const make = tags.Make?.description;
  const model = tags.Model?.description;
  
  if (!make || !model) {
    return undefined;
  }
  
  return {
    make,
    model,
    lens: tags.LensModel?.description
  };
}

// ========================================
// EXPOSURE EXTRACTION
// ========================================

/**
 * Extract exposure settings
 */
function extractExposure(tags: ExifReader.Tags): ExifExposureData | undefined {
  const iso = parseNumericValue(tags.ISOSpeedRatings?.value);
  const fNumber = parseNumericValue(tags.FNumber?.value);
  const exposureTime = tags.ExposureTime?.description;
  const focalLength = parseNumericValue(tags.FocalLength?.value);
  
  if (!iso && !fNumber && !exposureTime && !focalLength) {
    return undefined;
  }
  
  return {
    iso,
    fNumber,
    exposureTime,
    focalLength
  };
}

// ========================================
// TIMESTAMP EXTRACTION
// ========================================

/**
 * Extract photo timestamp (fallback chain)
 */
function extractTimestamp(tags: ExifReader.Tags): string {
  // Priority: DateTime > DateTimeOriginal > FileModifyDate > Now
  const dateTime = 
    tags.DateTime?.description ||
    tags.DateTimeOriginal?.description ||
    tags.FileModifyDate?.description;
  
  if (dateTime) {
    // Convert EXIF format (YYYY:MM:DD HH:MM:SS) to ISO
    const isoDate = dateTime.replace(/^(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3');
    return new Date(isoDate).toISOString();
  }
  
  // Fallback: Current time
  return new Date().toISOString();
}

// ========================================
// VALIDATION UTILITIES
// ========================================

/**
 * GPS-Koordinaten auf Plausibilität prüfen
 * 
 * ✅ Privacy: Warnt vor unwahrscheinlichen Positionen (z.B. 0,0 Koordinaten)
 * 
 * @param gps - Zu validierende GPS-Daten
 * @returns { valid: boolean, warnings: string[] }
 */
export function validateGPSCoordinates(gps: ExifGPSData): {
  valid: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];
  let valid = true;
  
  // Prüfung: Null Island (0, 0)
  if (isNullIsland(gps.latitude, gps.longitude)) {
    warnings.push(GPS_VALIDATION_MESSAGES.NULL_ISLAND);
    valid = false;
  }
  
  // Prüfung: WGS84-Grenzen
  if (!isWithinBounds(gps.latitude, gps.longitude)) {
    warnings.push(GPS_VALIDATION_MESSAGES.OUT_OF_BOUNDS);
    valid = false;
  }
  
  // Prüfung: Genauigkeit (>1000m = Warnung)
  if (gps.accuracy && gps.accuracy > GPS_BOUNDS.LAT_MAX) {
    warnings.push(GPS_VALIDATION_MESSAGES.LOW_ACCURACY(gps.accuracy));
  }
  
  // Prüfung: Höhe (extrem hoch/tief)
  if (gps.altitude) {
    if (gps.altitude > ALTITUDE_LIMITS.MAX) {
      warnings.push(GPS_VALIDATION_MESSAGES.ALTITUDE_TOO_HIGH);
      valid = false;
    }
    if (gps.altitude < ALTITUDE_LIMITS.MIN) {
      warnings.push(GPS_VALIDATION_MESSAGES.ALTITUDE_TOO_LOW);
      valid = false;
    }
  }
  
  return { valid, warnings };
}

// ========================================
// GEOJSON CONVERSION
// ========================================

/**
 * Convert GPS data to GeoJSON coordinates
 * 
 * ✅ MapComponents: Returns [lng, lat] format (NOT [lat, lng]!)
 * 
 * @param gps - GPS data
 * @returns [number, number] - [longitude, latitude]
 */
export function gpsToGeoJSON(gps: ExifGPSData): [number, number] {
  return [gps.longitude, gps.latitude]; // ✅ Correct order for GeoJSON!
}

// ========================================
// EXPORTS
// ========================================

export default {
  extractExifMetadata,
  validateGPSCoordinates,
  gpsToGeoJSON
};
