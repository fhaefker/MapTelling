/**
 * Thumbnail Generator
 * 
 * Komprimiert Bilder für Performance
 * 
 * ✅ WhereGroup-Prinzip: Performance Best Practice
 * 
 * @version 2.0
 */

import imageCompression from 'browser-image-compression';

/**
 * Erstellt Thumbnail aus File
 * 
 * @param file - Image File
 * @param maxSize - Maximale Breite/Höhe in Pixeln (default: 400)
 * @param quality - JPEG-Qualität 0-1 (default: 0.7)
 * @returns Data URL des Thumbnails
 */
export async function createThumbnail(
  file: File,
  maxSize: number = 400,
  quality: number = 0.7
): Promise<string> {
  try {
    // Komprimieren mit browser-image-compression
    const compressed = await imageCompression(file, {
      maxWidthOrHeight: maxSize,
      initialQuality: quality,
      useWebWorker: true, // Performance: Background Thread
      fileType: 'image/jpeg' // JPEG für kleinere Größe
    });
    
    // Zu Data URL konvertieren
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(compressed);
    });
  } catch (error) {
    console.error('Thumbnail generation failed:', error);
    throw error;
  }
}

/**
 * Erstellt Preview-Thumbnail (größer für Detail-Ansicht)
 * 
 * @param file - Image File
 * @returns Data URL des Preview-Thumbnails
 */
export async function createPreviewThumbnail(file: File): Promise<string> {
  return createThumbnail(file, 800, 0.8);
}

/**
 * Validiert Image-File
 * 
 * @param file - File Objekt
 * @param maxSizeMB - Maximale Dateigröße in MB (default: 10)
 * @returns Validierungs-Ergebnis
 */
export function validateImageFile(
  file: File,
  maxSizeMB: number = 10
): { valid: boolean; error?: string } {
  // MIME-Type Check
  if (!file.type.startsWith('image/')) {
    return {
      valid: false,
      error: 'Datei ist kein Bild'
    };
  }
  
  // Size Check
  const maxBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxBytes) {
    return {
      valid: false,
      error: `Datei zu groß (max ${maxSizeMB}MB)`
    };
  }
  
  return { valid: true };
}
