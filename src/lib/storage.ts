/**
 * Storage Layer
 * 
 * IndexedDB für Fotos (große Binärdaten)
 * LocalStorage für Story-Konfiguration (kleine JSON)
 * 
 * ✅ WhereGroup-Prinzip: Privacy by Design
 * - Lokale Speicherung (kein automatischer Upload)
 * - User-controlled Export
 * 
 * @version 2.0
 */

import { openDB, type IDBPDatabase } from 'idb';
import type { PhotoStory, PhotoFile } from '../types';

const DB_NAME = 'MapTelling';
const DB_VERSION = 1;
const STORAGE_KEY = 'maptelling-current-story';

/**
 * PhotoStorage - IndexedDB für große Binärdaten
 * 
 * ✅ Privacy by Design: Nur lokale Speicherung
 */
export class PhotoStorage {
  private static db: IDBPDatabase | null = null;
  
  /**
   * Öffnet IndexedDB Connection
   */
  private static async getDB(): Promise<IDBPDatabase> {
    if (!this.db) {
      this.db = await openDB(DB_NAME, DB_VERSION, {
        upgrade(db) {
          if (!db.objectStoreNames.contains('photos')) {
            db.createObjectStore('photos', { keyPath: 'id' });
          }
        }
      });
    }
    return this.db;
  }
  
  /**
   * Speichert Foto in IndexedDB
   * 
   * @param file - File-Objekt
   * @returns UUID des gespeicherten Fotos
   */
  static async store(file: File): Promise<string> {
    const db = await this.getDB();
    const id = crypto.randomUUID();
    const arrayBuffer = await file.arrayBuffer();
    
    const photoFile: PhotoFile = {
      id,
      data: arrayBuffer,
      type: file.type,
      name: file.name,
      size: file.size,
      created: new Date().toISOString()
    };
    
    await db.put('photos', photoFile);
    return id;
  }
  
  /**
   * Lädt Foto aus IndexedDB
   * 
   * @param id - Photo UUID
   * @returns Blob oder null falls nicht gefunden
   */
  static async get(id: string): Promise<Blob | null> {
    const db = await this.getDB();
    const photo = await db.get('photos', id);
    
    if (!photo) return null;
    
    return new Blob([photo.data], { type: photo.type });
  }
  
  /**
   * Löscht Foto aus IndexedDB
   * 
   * @param id - Photo UUID
   */
  static async delete(id: string): Promise<void> {
    const db = await this.getDB();
    await db.delete('photos', id);
  }
  
  /**
   * Listet alle Fotos auf
   * 
   * @returns Array aller PhotoFiles
   */
  static async getAll(): Promise<PhotoFile[]> {
    const db = await this.getDB();
    return db.getAll('photos');
  }
  
  /**
   * Löscht alle Fotos (Cleanup)
   */
  static async clear(): Promise<void> {
    const db = await this.getDB();
    await db.clear('photos');
  }
}

/**
 * StoryStorage - LocalStorage für Story-Konfiguration
 * 
 * ✅ WhereGroup-Prinzip: Configuration over Code
 */
export class StoryStorage {
  /**
   * Save story to LocalStorage
   */
  static async save(story: PhotoStory): Promise<void> {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(story));
    } catch (error) {
      console.error('Failed to save story:', error);
      throw new Error('Story save failed');
    }
  }  /**
   * Lädt Story aus LocalStorage
   * 
   * @returns PhotoStory oder null falls nicht vorhanden
   */
  static async load(): Promise<PhotoStory | null> {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Failed to load story:', error);
      return null;
    }
  }
  
  /**
   * Löscht Story aus LocalStorage
   */
  static clear(): void {
    localStorage.removeItem(STORAGE_KEY);
  }
  
  /**
   * Exportiert Story als JSON-Datei mit eingebetteten Fotos
   * 
   * ✅ WhereGroup-Prinzip: User-controlled Export
   * 
   * @param story - PhotoStory Objekt
   */
  static async export(story: PhotoStory): Promise<void> {
    // Fotos als Base64 Data URLs einbetten
    const exportData: PhotoStory = {
      ...story,
      features: await Promise.all(
        story.features.map(async (feature) => {
          const blob = await PhotoStorage.get(feature.properties.photoId);
          
          if (!blob) return feature;
          
          // Blob → Data URL
          const dataUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
          
          return {
            ...feature,
            properties: {
              ...feature.properties,
              photoUrl: dataUrl
            }
          };
        })
      )
    };
    
    // JSON Blob erstellen
    const blob = new Blob(
      [JSON.stringify(exportData, null, 2)],
      { type: 'application/json' }
    );
    
    // Download triggern
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${story.metadata.title.replace(/\s+/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
  
  /**
   * Importiert Story aus JSON-Datei
   * 
   * @param file - JSON-Datei
   * @returns Importierte PhotoStory
   */
  static async import(file: File): Promise<PhotoStory> {
    const text = await file.text();
    const story: PhotoStory = JSON.parse(text);
    
    // Validierung
    if (story.type !== 'FeatureCollection') {
      throw new Error('Invalid story format: Not a FeatureCollection');
    }
    
    // Fotos aus Data URLs in IndexedDB speichern
    for (const feature of story.features) {
      if (feature.properties.photoUrl) {
        // Data URL → Blob
        const response = await fetch(feature.properties.photoUrl);
        const blob = await response.blob();
        
        // In IndexedDB speichern
        const photoId = await PhotoStorage.store(
          new File([blob], feature.properties.photoId, { type: blob.type })
        );
        
        feature.properties.photoId = photoId;
      }
    }
    
    return story;
  }
}
