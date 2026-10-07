import pino, { type DestinationStream, type Logger, type LoggerOptions } from 'pino';

export const REDACTED = '[Redacted]';

export const redactPaths = [
  'req.headers.authorization',
  'req.headers.cookie',
  'apiKey',
  'token',
  'password',
  'secret',
  'authorization',
  'TYPESAFE_API_KEY',
  'metadata.token',
  'metadata.password',
  'metadata.secret',
  'metadata.apiKey',
  'metadata.authorization',
  '*.token',
  '*.password',
  '*.secret',
  '*.apiKey',
  '*.authorization',
];

export function loggerOptions(level = process.env.LOG_LEVEL ?? 'info'): LoggerOptions {
  return {
    level,
    base: { service: 'signalgate' },
    timestamp: pino.stdTimeFunctions.isoTime,
    redact: { paths: redactPaths, censor: REDACTED },
    formatters: {
      level(label) {
        return { level: label };
      },
    },
  };
}

export function createLogger(options?: {
  level?: string;
  destination?: DestinationStream;
}): Logger {
  const settings = loggerOptions(options?.level);
  if (options?.destination === undefined) return pino(settings);
  return pino(settings, options.destination);
}
