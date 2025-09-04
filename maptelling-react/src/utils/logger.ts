type LogLevel = 'debug' | 'info' | 'warn' | 'error';

let currentLevel: LogLevel = ((): LogLevel => {
  if (typeof window !== 'undefined' && window.location.search.includes('debug')) return 'debug';
  return 'info';
})();

const order: LogLevel[] = ['debug','info','warn','error'];

export const setLogLevel = (lvl: LogLevel) => { currentLevel = lvl; };

const shouldLog = (lvl: LogLevel) => order.indexOf(lvl) >= order.indexOf(currentLevel);

export const log = {
  debug: (...args: any[]) => shouldLog('debug') && console.debug('[MT]', ...args),
  info: (...args: any[]) => shouldLog('info') && console.info('[MT]', ...args),
  warn: (...args: any[]) => shouldLog('warn') && console.warn('[MT]', ...args),
  error: (...args: any[]) => shouldLog('error') && console.error('[MT]', ...args),
};

export default log;
