import { useState, useCallback } from 'react';
import { 
  extractExifMetadata, 
  validateGPSCoordinates, 
  gpsToGeoJSON 
} from '../utils/exifParser';
import type { ExifData } from '../types/story';

interface ExifParseResult {
  gps: [number, number] | null;
  exif: ExifData | null;
  gpsWarnings?: string[];
}

/**
 * useExifParser Hook
 * 
 * Extracts GPS coordinates and EXIF metadata from image files.
 * Uses the new exifParser utility with comprehensive validation.
 * 
 * ✅ WhereGroup: Privacy by Design (local processing)
 * ✅ MapComponents: Returns GeoJSON [lng, lat] format
 * 
 * @returns {Object} Parser functions and state
 * @returns {Function} parseExif - Parses EXIF data from file
 * @returns {boolean} parsing - Loading state
 * 
 * @example
 * const { parseExif, parsing } = useExifParser();
 * const result = await parseExif(file);
 * if (result.gps) {
 *   console.log('Coordinates:', result.gps); // [lng, lat]
 *   if (result.gpsWarnings?.length > 0) {
 *     console.warn('GPS Warnings:', result.gpsWarnings);
 *   }
 * }
 */
export const useExifParser = () => {
  const [parsing, setParsing] = useState(false);
  
  const parseExif = useCallback(async (file: File): Promise<ExifParseResult> => {
    setParsing(true);
    
    try {
      // Extract all EXIF metadata
      const metadata = await extractExifMetadata(file);
      
      // Convert to legacy ExifData format (for compatibility)
      const exif: ExifData | null = metadata.camera || metadata.exposure ? {
        camera: metadata.camera 
          ? `${metadata.camera.make} ${metadata.camera.model}`.trim()
          : undefined,
        lens: metadata.camera?.lens,
        dateTime: metadata.timestamp,
        gpsAltitude: metadata.gps?.altitude,
        gpsAccuracy: metadata.gps?.accuracy,
        focalLength: metadata.exposure?.focalLength,
        aperture: metadata.exposure?.fNumber,
        shutterSpeed: metadata.exposure?.exposureTime,
        iso: metadata.exposure?.iso
      } : null;
      
      // GPS Handling with Validation
      let gps: [number, number] | null = null;
      let gpsWarnings: string[] = [];
      
      if (metadata.gps) {
        const validation = validateGPSCoordinates(metadata.gps);
        
        if (validation.valid) {
          gps = gpsToGeoJSON(metadata.gps); // ✅ Returns [lng, lat]
        } else {
          console.warn('Invalid GPS coordinates:', validation.warnings);
        }
        
        gpsWarnings = validation.warnings;
      }
      
      return { 
        gps, 
        exif,
        gpsWarnings: gpsWarnings.length > 0 ? gpsWarnings : undefined
      };
      
    } catch (error) {
      console.warn('EXIF parsing failed:', error);
      return { gps: null, exif: null };
    } finally {
      setParsing(false);
    }
  }, []);
  
  return { parseExif, parsing };
};
