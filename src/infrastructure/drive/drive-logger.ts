import { sanitizeLogEntry } from "../../domain/dlp/dlp-sanitizer";

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

    // Telemetría remota protegida con DLP:
    // En producción solo enviamos eventos de tipo 'error'.
    // En desarrollo local (localhost) enviamos todos los tipos para inspección en terminal.
    if (typeof window !== 'undefined') {
      const isLocalhost =
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1';

      if (isLocalhost || type === 'error') {
        const sanitized = sanitizeLogEntry(entry);
        fetch('/api/logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sanitized),
        }).catch(() => {
          // Ignorar fallas silenciosas de red para no interrumpir al usuario
        });
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
 */
export function initGlobalErrorTelemetry() {
  if (typeof window === 'undefined') return;
  if ((window as any).__telemetry_initialized) return;
  (window as any).__telemetry_initialized = true;

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
