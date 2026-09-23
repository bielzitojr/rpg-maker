// services/debugLogger.ts

export type LogType = 'info' | 'warn' | 'error';

export interface LogEntry {
  id: string;
  timestamp: string;
  type: LogType;
  message: string;
  details?: string;
}

class DebugLogger {
  private logs: LogEntry[] = [];
  private listeners: ((logs: LogEntry[]) => void)[] = [];
  private isInitialized = false;

  init() {
    if (this.isInitialized) return;
    this.isInitialized = true;

    // Capture unhandled errors (crashes)
    window.onerror = (message, source, lineno, colno, error) => {
      this.addLog('error', `Crash: ${message}`, `Source: ${source}:${lineno}:${colno}\nStack: ${error?.stack}`);
    };

    // Capture unhandled promise rejections (async crashes)
    window.onunhandledrejection = (event) => {
      this.addLog('error', `Unhandled Promise Rejection`, String(event.reason));
    };

    // Proxy console methods to capture logs
    const originalError = console.error;
    console.error = (...args) => {
      this.addLog('error', args.map(String).join(' '));
      originalError.apply(console, args);
    };

    const originalWarn = console.warn;
    console.warn = (...args) => {
      this.addLog('warn', args.map(String).join(' '));
      originalWarn.apply(console, args);
    };
    
    // Initial log
    this.addLog('info', 'Debug Logger Initialized', 'Tracking system events...');
  }

  addLog(type: LogType, message: string, details?: string) {
    const entry: LogEntry = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2),
      timestamp: new Date().toLocaleTimeString(),
      type,
      message,
      details
    };
    
    // Keep only last 100 logs to prevent memory leak
    if (this.logs.length > 100) {
        this.logs.shift();
    }
    
    this.logs.push(entry);
    this.notifyListeners();
  }

  getLogs() {
    return this.logs;
  }

  clear() {
    this.logs = [];
    this.notifyListeners();
  }

  subscribe(listener: (logs: LogEntry[]) => void) {
    this.listeners.push(listener);
    listener(this.logs); // Initial callback
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.logs));
  }
}

export const debugLogger = new DebugLogger();