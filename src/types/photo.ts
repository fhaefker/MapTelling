/**
 * Photo File Types
 * 
 * IndexedDB Storage-Strukturen
 * 
 * @version 2.0
 */

/**
 * Photo File in IndexedDB
 */
export interface PhotoFile {
  /** UUID v4 */
  id: string;
  
  /** File-Daten als ArrayBuffer */
  data: ArrayBuffer;
  
  /** MIME-Type (z.B. "image/jpeg") */
  type: string;
  
  /** Original Dateiname */
  name: string;
  
  /** Dateigröße in Bytes */
  size: number;
  
  /** Upload-Zeitstempel (ISO 8601) */
  created: string;
}

/**
 * Photo Upload Result
 */
export interface PhotoUploadResult {
  /** IndexedDB Key */
  id: string;
  
  /** Thumbnail Data URL */
  thumbnailUrl: string;
  
  /** Extrahierte GPS-Koordinaten [lng, lat] oder null */
  coordinates: [number, number] | null;
  
  /** Extrahierte EXIF-Daten oder null */
  exif: import('./story').ExifData | null;
  
  /** Fehler-Message (optional) */
  error?: string;
}
