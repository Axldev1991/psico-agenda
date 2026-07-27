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

    // Enviar telemetría al servidor Next.js en desarrollo de forma no bloqueante
    if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
      fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
      }).catch(err => {
        // Ignorar fallas silenciosas de red local para no ensuciar la consola
      });
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
