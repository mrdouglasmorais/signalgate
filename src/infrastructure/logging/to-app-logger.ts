import type { AppLogger, LogFields } from '@/application/ports/app-logger.js';

type LogSink = {
  info(fields: LogFields, message: string): void;
  warn(fields: LogFields, message: string): void;
  error(fields: LogFields, message: string): void;
};

export function toAppLogger(sink: LogSink): AppLogger {
  return {
    info(fields, message) {
      sink.info(fields, message);
    },
    warn(fields, message) {
      sink.warn(fields, message);
    },
    error(fields, message) {
      sink.error(fields, message);
    },
  };
}
