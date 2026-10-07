import { Writable } from 'node:stream';

import { createLogger } from '@/infrastructure/logging/create-logger.js';
import type { Logger } from 'pino';

export function captureLogger(level = 'info'): {
  logger: Logger;
  lines: () => Record<string, unknown>[];
} {
  const records: Record<string, unknown>[] = [];
  const stream = new Writable({
    write(chunk, _encoding, callback) {
      const text = String(chunk).trim();
      if (text.length > 0) {
        for (const line of text.split('\n')) {
          records.push(JSON.parse(line) as Record<string, unknown>);
        }
      }
      callback();
    },
  });
  return { logger: createLogger({ level, destination: stream }), lines: () => records };
}
