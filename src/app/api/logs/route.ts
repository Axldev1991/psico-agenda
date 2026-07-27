import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
  try {
    const entry = await request.json();
    const { timestamp, type, message, details } = entry;

    // 1. Formatear para consola del servidor (terminal)
    const typeEmojis: Record<string, string> = {
      info: 'ℹ️',
      request: '📤',
      response: '📥',
      error: '❌',
    };
    const emoji = typeEmojis[type] || '📝';
    
    // Imprimir en consola de desarrollo
    console.log(`[Browser Logs] ${emoji} [${timestamp}] [${type.toUpperCase()}]: ${message}`);
    if (details) {
      console.log(JSON.stringify(details, null, 2));
    }

    // 2. Guardar en archivo local logs/drive-sync.log
    const logDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    const logFilePath = path.join(logDir, 'drive-sync.log');
    const logLine = `[${new Date().toISOString()}] [${type.toUpperCase()}] ${message} ${details ? JSON.stringify(details) : ''}\n`;
    fs.appendFileSync(logFilePath, logLine, 'utf8');

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error procesando telemetria de logs:', error);
    return NextResponse.json({ error: 'Failed to write logs' }, { status: 500 });
  }
}
