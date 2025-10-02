import { useState, useCallback } from 'react';
import ExifReader from 'exifreader';
import { convertDMSToDD } from '../lib/exif-utils';
import type { ExifData } from '../types/story';

interface ExifParseResult {
  gps: [number, number] | null;
  exif: ExifData | null;
}

/**
 * useExifParser Hook
 * 
 * Extracts GPS coordinates and EXIF metadata from image files.
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
 * }
 */
export const useExifParser = () => {
  const [parsing, setParsing] = useState(false);
  
  const parseExif = useCallback(async (file: File): Promise<ExifParseResult> => {
    setParsing(true);
    
    try {
      const tags = await ExifReader.load(file);
      
      // GPS-Koordinaten extrahieren
      let gps: [number, number] | null = null;
      if (tags.GPSLatitude && tags.GPSLongitude) {
        const lat = convertDMSToDD(tags.GPSLatitude.description || '');
        const lng = convertDMSToDD(tags.GPSLongitude.description || '');
        
        // Hemisphären berücksichtigen (N/S, E/W)
        const latRef = tags.GPSLatitudeRef?.value?.[0];
        const lngRef = tags.GPSLongitudeRef?.value?.[0];
        
        const finalLat = latRef === 'S' ? -lat : lat;
        const finalLng = lngRef === 'W' ? -lng : lng;
        
        // Validierung: Koordinaten im gültigen Bereich?
        if (
          finalLat >= -90 && finalLat <= 90 &&
          finalLng >= -180 && finalLng <= 180
        ) {
          gps = [finalLng, finalLat]; // GeoJSON: [lng, lat]
        }
      }
      
      // EXIF-Metadaten extrahieren
      const exif: ExifData = {
        camera: tags.Model?.description,
        lens: tags.LensModel?.description,
        dateTime: tags.DateTime?.description,
        gpsAltitude: tags.GPSAltitude?.description 
          ? parseFloat(tags.GPSAltitude.description)
          : undefined,
        gpsAccuracy: tags.GPSHPositioningError?.description
          ? parseFloat(tags.GPSHPositioningError.description)
          : undefined,
        orientation: tags.Orientation?.value,
        focalLength: tags.FocalLength?.description
          ? parseFloat(tags.FocalLength.description)
          : undefined,
        aperture: tags.FNumber?.description
          ? parseFloat(tags.FNumber.description)
          : undefined,
        shutterSpeed: tags.ExposureTime?.description,
        iso: tags.ISOSpeedRatings?.description
          ? parseInt(tags.ISOSpeedRatings.description)
          : undefined
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
