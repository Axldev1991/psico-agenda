export interface LogEntry {
  timestamp: string;
  type: 'info' | 'request' | 'response' | 'error';
  message: string;
  details?: any;
}

type LogListener = (entry: LogEntry) => void;
const listeners = new Set<LogListener>();
const logs: LogEntry[] = [];

export const driveLogger = {
  log(type: LogEntry['type'], message: string, details?: any) {
    const entry: LogEntry = {
      timestamp: new Date().toLocaleTimeString(),
      type,
      message,
      details
    };
    logs.push(entry);
    if (logs.length > 100) logs.shift(); // keep last 100 logs
    listeners.forEach(l => l(entry));
  },
  
  subscribe(listener: LogListener) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  
  getLogs() {
    return [...logs];
  },
  
  clear() {
    logs.length = 0;
    // Notify clean status
    const entry: LogEntry = { timestamp: new Date().toLocaleTimeString(), type: 'info', message: 'Logs limpiados' };
    listeners.forEach(l => l(entry));
  }
};
