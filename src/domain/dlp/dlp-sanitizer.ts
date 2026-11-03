/**
 * DLP (Data Loss Prevention) Sanitizer for Psico-Agenda
 * Pure domain logic to sanitize, scrub and anonymize operational logs
 * preventing any patient data, clinical notes, or PII from leaking.
 */

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const PHONE_REGEX = /(?:\+?54\s?)?(?:9\s?)?(?:11|[2368]\d)\s?(?:15\s?)?\d{4}[-\s]?\d{4}|\b\d{2,4}[-\s]\d{6,8}\b/g;
const DNI_REGEX = /(?<![0-9a-zA-Z])\d{7,8}(?!\.\.\.)(?![0-9a-zA-Z])/g;
const HTML_BLOCK_REGEX = /<([a-zA-Z0-9]+)[^>]*>[\s\S]*?<\/\1>|<[^>]+>/gi;
const UUID_REGEX = /\b([0-9a-fA-F]{8})-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\b/g;

const SENSITIVE_KEYS = new Set([
  'fullname',
  'name',
  'patientname',
  'notes',
  'clinicalhistory',
  'description',
  'email',
  'phone',
  'address',
  'healthinsurance',
  'affiliatenumber',
  'birthdate',
  'age',
  'sessioncontents',
]);

const ALLOWED_KEYS = new Set([
  'status',
  'statuscode',
  'code',
  'type',
  'method',
  'url',
  'path',
  'line',
  'column',
  'component',
  'action',
  'operation',
  'file',
  'error',
  'message',
  'stack',
  'cause',
  'timestamp',
]);

export function sanitizeLogMessage(message: string): string {
  if (!message || typeof message !== 'string') return '';

  let sanitized = message;

  // 1. Scrub/truncate UUIDs first to prevent digits inside UUIDs from triggering phone or ID redaction
  sanitized = sanitized.replace(UUID_REGEX, '$1...');

  // 2. Scrub HTML and clinical markup
  sanitized = sanitized.replace(HTML_BLOCK_REGEX, '[HTML_REDACTED]');

  // 3. Scrub emails
  sanitized = sanitized.replace(EMAIL_REGEX, '[EMAIL_REDACTED]');

  // 4. Scrub phone numbers
  sanitized = sanitized.replace(PHONE_REGEX, '[PHONE_REDACTED]');

  // 5. Scrub national IDs (DNI / Cédulas: 7 or 8 isolated digits)
  sanitized = sanitized.replace(DNI_REGEX, '[ID_REDACTED]');

  return sanitized;
}

export function sanitizeLogDetails(details: any, depth = 0): any {
  if (details === null || details === undefined) return details;
  if (depth > 3) return '[DEPTH_LIMIT]';

  if (typeof details === 'string') {
    return sanitizeLogMessage(details);
  }

  if (typeof details === 'number' || typeof details === 'boolean') {
    return details;
  }

  if (Array.isArray(details)) {
    return details.slice(0, 10).map((item) => sanitizeLogDetails(item, depth + 1));
  }

  if (typeof details === 'object') {
    const sanitizedObj: Record<string, any> = {};

    for (const [key, value] of Object.entries(details)) {
      const lowerKey = key.toLowerCase();

      // Explicitly reject any sensitive key
      if (SENSITIVE_KEYS.has(lowerKey)) {
        continue;
      }

      // Check if key is in allowed technical properties
      if (ALLOWED_KEYS.has(lowerKey)) {
        sanitizedObj[key] = sanitizeLogDetails(value, depth + 1);
      }
    }

    return sanitizedObj;
  }

  return '[UNSUPPORTED_DATA]';
}

export interface SanitizedLogEntry {
  timestamp: string;
  type: string;
  message: string;
  details?: any;
}

export function sanitizeLogEntry(entry: {
  timestamp: string;
  type: string;
  message: string;
  details?: any;
}): SanitizedLogEntry {
  return {
    timestamp: entry.timestamp,
    type: entry.type,
    message: sanitizeLogMessage(entry.message),
    details: entry.details ? sanitizeLogDetails(entry.details) : undefined,
  };
}
