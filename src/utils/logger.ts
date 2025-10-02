/**
 * Logger Utility
 * Structured logging for MapTelling
 * 
 * ✅ WhereGroup: Transparenz & Debugging
 * ✅ Privacy: Keine sensiblen Daten loggen
 * 
 * @module utils/logger
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  module: string;
  message: string;
  data?: unknown;
  timestamp: string;
}

/**
 * Logger Class
 * 
 * Development: Alle Logs in Console
 * Production: Nur Warnings & Errors
 */
class Logger {
  private isDevelopment = import.meta.env.DEV;
  
  private log(level: LogLevel, module: string, message: string, data?: unknown): void {
    const entry: LogEntry = {
      level,
      module,
      message,
      data,
      timestamp: new Date().toISOString()
    };
    
    // Development: Alle Logs
    if (this.isDevelopment) {
      this.consoleLog(entry);
      return;
    }
    
    // Production: Nur Warnings & Errors
    if (level === 'warn' || level === 'error') {
      this.consoleLog(entry);
    }
  }
  
  private consoleLog(entry: LogEntry): void {
    const prefix = `[${entry.timestamp}] [${entry.module}]`;
    
    switch (entry.level) {
      case 'debug':
        console.debug(prefix, entry.message, entry.data);
        break;
      case 'info':
        console.info(prefix, entry.message, entry.data);
        break;
      case 'warn':
        console.warn(prefix, entry.message, entry.data);
        break;
      case 'error':
        console.error(prefix, entry.message, entry.data);
        break;
    }
  }
  
  // Public API
  debug(module: string, message: string, data?: unknown): void {
    this.log('debug', module, message, data);
  }
  
  info(module: string, message: string, data?: unknown): void {
    this.log('info', module, message, data);
  }
  
  warn(module: string, message: string, data?: unknown): void {
    this.log('warn', module, message, data);
  }
  
  error(module: string, message: string, data?: unknown): void {
    this.log('error', module, message, data);
  }
}

// Singleton Instance
export const logger = new Logger();

// Convenience exports
export const log = {
  debug: (module: string, message: string, data?: unknown) => 
    logger.debug(module, message, data),
  info: (module: string, message: string, data?: unknown) => 
    logger.info(module, message, data),
  warn: (module: string, message: string, data?: unknown) => 
    logger.warn(module, message, data),
  error: (module: string, message: string, data?: unknown) => 
    logger.error(module, message, data)
};
