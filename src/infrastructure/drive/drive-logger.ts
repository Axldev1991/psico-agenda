import { sanitizeLogEntry, SanitizedLogEntry } from "../../domain/dlp/dlp-sanitizer";

export interface LogEntry {
  timestamp: string;
  type: 'info' | 'request' | 'response' | 'error';
  message: string;
  details?: any;
}

type LogListener = (entry: LogEntry) => void;
const listeners = new Set<LogListener>();
const logs: LogEntry[] = [];

const OFFLINE_QUEUE_KEY = 'psico_offline_error_queue';
const MAX_OFFLINE_QUEUE_SIZE = 10;
let isFlushingQueue = false;

export function getOfflineErrorQueue(): SanitizedLogEntry[] {
  if (typeof window === 'undefined' || !window.localStorage) return [];
  try {
    const raw = window.localStorage.getItem(OFFLINE_QUEUE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function clearOfflineErrorQueue(): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.removeItem(OFFLINE_QUEUE_KEY);
  } catch {
    // Ignore storage errors
  }
}

export function enqueueOfflineLog(entry: SanitizedLogEntry | LogEntry): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    const queue = getOfflineErrorQueue();
    queue.push(entry);
    while (queue.length > MAX_OFFLINE_QUEUE_SIZE) {
      queue.shift(); // drop oldest to maintain ring-buffer size
    }
    window.localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  } catch {
    // Ignore storage errors
  }
}

export async function flushOfflineErrorQueue(): Promise<void> {
  if (typeof window === 'undefined') return;
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return;
  if (isFlushingQueue) return;

  const queue = getOfflineErrorQueue();
  if (queue.length === 0) return;

  isFlushingQueue = true;
  try {
    const remaining: SanitizedLogEntry[] = [...queue];
    while (remaining.length > 0) {
      const entry = remaining[0];
      try {
        const res = await fetch('/api/logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(entry),
        });
        if (!res.ok) {
          // Stop flushing if endpoint reports non-ok
          break;
        }
        remaining.shift();
      } catch {
        // Network error during send, keep remaining
        break;
      }
    }
    if (typeof window.localStorage !== 'undefined') {
      window.localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(remaining));
    }
  } finally {
    isFlushingQueue = false;
  }
}

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

    // Telemetría remota protegida con DLP + cola offline:
    // En producción solo enviamos eventos de tipo 'error'.
    // En desarrollo local (localhost) enviamos todos los tipos para inspección en terminal.
    if (typeof window !== 'undefined') {
      const isLocalhost =
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1';

      if (isLocalhost || type === 'error') {
        const sanitized = sanitizeLogEntry(entry);
        const isOnline = typeof navigator === 'undefined' || navigator.onLine !== false;

        if (!isOnline) {
          enqueueOfflineLog(sanitized);
        } else {
          fetch('/api/logs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(sanitized),
          }).then(res => {
            if (!res.ok) {
              enqueueOfflineLog(sanitized);
            }
          }).catch(() => {
            enqueueOfflineLog(sanitized);
          });
        }
      }
    }
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

  getOfflineQueue: getOfflineErrorQueue,
  clearOfflineQueue: clearOfflineErrorQueue,
  flushOfflineQueue: flushOfflineErrorQueue,
  
  downloadDiagnosticLogs() {
    if (typeof window === 'undefined') return;
    
    const logsText = logs.map(l => {
      const detailsStr = l.details ? `\nDetalles: ${JSON.stringify(l.details, null, 2)}` : '';
      return `[${l.timestamp}] [${l.type.toUpperCase()}] ${l.message}${detailsStr}`;
    }).join('\n\n');

    const blob = new Blob([logsText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `diagnostico_logs_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  clear() {
    logs.length = 0;
    // Notify clean status
    const entry: LogEntry = { timestamp: new Date().toLocaleTimeString(), type: 'info', message: 'Logs limpiados' };
    listeners.forEach(l => l(entry));
  }
};

/**
 * Inicializa la captura automática de errores no controlados a nivel de ventana
 * y configura la reconexión para vaciar la cola offline
 */
export function initGlobalErrorTelemetry() {
  if (typeof window === 'undefined') return;
  if ((window as any).__telemetry_initialized) return;
  (window as any).__telemetry_initialized = true;

  // Intentar vaciar cola offline al iniciar si hay conexión
  flushOfflineErrorQueue().catch(() => {});

  // Vaciar cola offline ante reconexión de red
  window.addEventListener('online', () => {
    flushOfflineErrorQueue().catch(() => {});
  });

  window.addEventListener('error', (event) => {
    driveLogger.log('error', `Excepción no controlada: ${event.message || 'Error desconocido'}`, {
      file: event.filename,
      line: event.lineno,
      column: event.colno,
      stack: event.error?.stack,
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    const msg = reason instanceof Error ? reason.message : String(reason);
    driveLogger.log('error', `Promesa rechazada no controlada: ${msg}`, {
      stack: reason instanceof Error ? reason.stack : undefined,
    });
  });
}
