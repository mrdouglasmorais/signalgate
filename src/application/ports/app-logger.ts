export type LogFields = {
  event?: string;
  requestId?: string;
  incidentId?: string;
  traceId?: string;
  decisionEngine?: string;
  severity?: number;
  confidence?: number;
  err?: unknown;
};

export type AppLogger = {
  info(fields: LogFields, message: string): void;
  warn(fields: LogFields, message: string): void;
  error(fields: LogFields, message: string): void;
};
