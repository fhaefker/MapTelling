import { useState, useCallback } from 'react';
import { useExifParser } from './useExifParser';
import { createThumbnail } from '../lib/thumbnail';
import { PhotoStorage } from '../lib/storage';
import type { PhotoUploadResult } from '../types/photo';

interface UsePhotoUploadOptions {
  maxSizeMB?: number;              // Default: 10
  thumbnailSize?: number;          // Default: 400
  onSuccess?: (result: PhotoUploadResult) => void;
  onError?: (error: Error) => void;
}

/**
 * usePhotoUpload Hook
 * 
 * Handles photo upload workflow:
 * 1. File validation
 * 2. EXIF extraction (GPS + metadata)
 * 3. Thumbnail generation
 * 4. IndexedDB storage
 * 
 * @param {UsePhotoUploadOptions} options - Configuration
 * @returns {Object} Upload functions and state
 * @returns {Function} uploadPhoto - Uploads photo and returns result
 * @returns {boolean} uploading - Loading state
 * @returns {number} progress - Upload progress (0-100)
 * 
 * @example
 * const { uploadPhoto, uploading, progress } = usePhotoUpload({
 *   maxSizeMB: 10,
 *   onSuccess: (result) => addPhotoToStory(result)
 * });
 * 
 * const handleFile = async (file: File) => {
 *   const result = await uploadPhoto(file);
 *   console.log('Photo uploaded:', result.id);
 * };
 */
export const usePhotoUpload = (options: UsePhotoUploadOptions = {}) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { parseExif } = useExifParser();
  
  const uploadPhoto = useCallback(async (file: File): Promise<PhotoUploadResult> => {
    setUploading(true);
    setProgress(0);
    
    try {
      // 1. Validierung
      const maxBytes = (options.maxSizeMB || 10) * 1024 * 1024;
      if (file.size > maxBytes) {
        throw new Error(`Datei zu groß (max ${options.maxSizeMB || 10}MB)`);
      }
      
      // Dateiformat prüfen
      if (!file.type.startsWith('image/')) {
        throw new Error('Nur Bilddateien erlaubt');
      }
      
      setProgress(20);
      
      // 2. EXIF Extraktion
      const { gps, exif } = await parseExif(file);
      const coordinates = gps || null;
      
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
      
      // Callback ausführen
      if (options.onSuccess) {
        options.onSuccess(result);
      }
      
      return result;
      
    } catch (error) {
      const err = error as Error;
      
      // Callback ausführen
      if (options.onError) {
        options.onError(err);
      }
      
      throw err;
    } finally {
      setUploading(false);
      // Progress nach kurzer Verzögerung zurücksetzen
      setTimeout(() => setProgress(0), 500);
    }
  }, [options, parseExif]);
  
  return {
    uploadPhoto,
    uploading,
    progress
  };
};
