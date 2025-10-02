/**
 * EXIF Utilities
 * 
 * GPS-Koordinaten Extraktion & Konvertierung
 * 
 * ✅ Standard: ISO EXIF
 * ✅ WhereGroup-Prinzip: Standards-driven
 * 
 * @version 2.0
 */

/**
 * Konvertiert DMS (Degrees Minutes Seconds) zu DD (Decimal Degrees)
 * 
 * EXIF GPS-Format: "50/1, 43/1, 48/1" = 50° 43' 48"
 * 
 * @param dms - DMS String oder Array
 * @returns Decimal Degrees
 */
export function convertDMSToDD(dms: string | number[]): number {
  let degrees: number, minutes: number, seconds: number;
  
  if (typeof dms === 'string') {
    const parts = dms.split(',').map(part => {
      const [num, den] = part.trim().split('/').map(Number);
      return num / (den || 1);
    });
    [degrees, minutes, seconds] = parts;
  } else {
    [degrees, minutes, seconds] = dms;
  }
  
  return degrees + minutes / 60 + seconds / 3600;
}

/**
 * Konvertiert DD (Decimal Degrees) zu DMS (Degrees Minutes Seconds)
 * 
 * @param dd - Decimal Degrees
 * @returns DMS Object
 */
export function convertDDToDMS(dd: number): {
  degrees: number;
  minutes: number;
  seconds: number;
} {
  const absolute = Math.abs(dd);
  const degrees = Math.floor(absolute);
  const minutesNotTruncated = (absolute - degrees) * 60;
  const minutes = Math.floor(minutesNotTruncated);
  const seconds = (minutesNotTruncated - minutes) * 60;
  
  return { degrees, minutes, seconds };
}

/**
 * Formatiert Koordinaten für Anzeige
 * 
 * @param lng - Longitude
 * @param lat - Latitude
 * @param precision - Dezimalstellen (default: 6)
 * @returns Formatierter String
 */
export function formatCoordinates(
  lng: number,
  lat: number,
  precision: number = 6
): string {
  const lngDir = lng >= 0 ? 'E' : 'W';
  const latDir = lat >= 0 ? 'N' : 'S';
  
  return `${Math.abs(lat).toFixed(precision)}° ${latDir}, ${Math.abs(lng).toFixed(precision)}° ${lngDir}`;
}

/**
 * Validiert GPS-Koordinaten
 * 
 * @param lng - Longitude
 * @param lat - Latitude
 * @returns true wenn gültig
 */
export function validateCoordinates(lng: number, lat: number): boolean {
  return (
    !isNaN(lng) &&
    !isNaN(lat) &&
    lng >= -180 &&
    lng <= 180 &&
    lat >= -90 &&
    lat <= 90
  );
}
