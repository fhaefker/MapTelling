/**
 * EXIF Metadata Parser
 * Extracts GPS, Camera, and Exposure data from photos
 * 
 * @module utils/exifParser
 * @see CONCEPT_V2_01_GPS_POSITIONING.md
 */

import ExifReader from 'exifreader';

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
    console.error('EXIF extraction failed:', error);
    
    // Fallback: Return minimal metadata
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
 * ✅ WhereGroup Privacy: No cloud uploads, local processing only
 * ✅ MapComponents: Returns [lng, lat] format for GeoJSON
 * 
 * @param tags - ExifReader tags
 * @returns ExifGPSData | undefined
 */
function extractGPS(tags: ExifReader.Tags): ExifGPSData | undefined {
  // Check if GPS data exists
  if (!tags.GPSLatitude || !tags.GPSLongitude) {
    return undefined; // ❌ No GPS available
  }
  
  try {
    // Convert DMS (Degrees Minutes Seconds) to Decimal
    const lat = convertDMSToDecimal(
      tags.GPSLatitude.description,
      tags.GPSLatitudeRef?.value?.[0] || 'N'
    );
    
    const lon = convertDMSToDecimal(
      tags.GPSLongitude.description,
      tags.GPSLongitudeRef?.value?.[0] || 'E'
    );
    
    // Validate coordinates
    if (!isValidCoordinate(lat, lon)) {
      console.warn('Invalid GPS coordinates:', lat, lon);
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
    console.error('GPS extraction failed:', error);
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
 * Validate GPS coordinates
 * 
 * @param lat - Latitude (-90 to 90)
 * @param lon - Longitude (-180 to 180)
 * @returns boolean
 */
function isValidCoordinate(lat: number, lon: number): boolean {
  return (
    !isNaN(lat) &&
    !isNaN(lon) &&
    lat >= -90 &&
    lat <= 90 &&
    lon >= -180 &&
    lon <= 180
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
 * Validate GPS coordinates for plausibility
 * 
 * ✅ Privacy: Warns about unlikely locations (e.g., 0,0 coordinates)
 * 
 * @param gps - GPS data to validate
 * @returns { valid: boolean, warnings: string[] }
 */
export function validateGPSCoordinates(gps: ExifGPSData): {
  valid: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];
  let valid = true;
  
  // Check for null island (0, 0)
  if (gps.latitude === 0 && gps.longitude === 0) {
    warnings.push('Coordinates are at (0, 0) - likely invalid GPS data');
    valid = false;
  }
  
  // Check for extremely high accuracy errors (>1000m)
  if (gps.accuracy && gps.accuracy > 1000) {
    warnings.push(`Low GPS accuracy: ${gps.accuracy}m`);
  }
  
  // Check for extreme altitudes
  if (gps.altitude) {
    if (gps.altitude > 8850) {
      warnings.push('Altitude higher than Mt. Everest - likely invalid');
      valid = false;
    }
    if (gps.altitude < -500) {
      warnings.push('Altitude below Dead Sea level - likely invalid');
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
