type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export declare const setLogLevel: (lvl: LogLevel) => void;
export declare const log: {
  debug: (...args: any[]) => void;
  info: (...args: any[]) => void;
  warn: (...args: any[]) => void;
  error: (...args: any[]) => void;
};
export default log;
