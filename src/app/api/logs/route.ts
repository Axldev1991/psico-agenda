import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const entry = await request.json();
    const { timestamp, type, message, details } = entry;

    const typeEmojis: Record<string, string> = {
      info: 'ℹ️',
      request: '📤',
      response: '📥',
      error: '❌',
    };
    const emoji = typeEmojis[type] || '📝';
    const logPrefix = `[Remote Telemetry] ${emoji} [${timestamp || new Date().toISOString()}] [${(type || 'INFO').toUpperCase()}]: ${message}`;

    if (type === 'error') {
      console.error(logPrefix, details ? JSON.stringify(details) : '');
    } else {
      console.log(logPrefix, details ? JSON.stringify(details) : '');
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Error procesando telemetría de logs:', error);
    return NextResponse.json({ error: 'Failed to process logs' }, { status: 500 });
  }
}
