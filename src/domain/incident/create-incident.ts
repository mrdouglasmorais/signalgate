import { isEnvironment } from '@/domain/incident/environment.js';
import { InvalidIncidentError } from '@/domain/incident/errors.js';
import type { Incident } from '@/domain/incident/incident.js';
import { incidentId } from '@/domain/incident/incident-id.js';
import type { Metadata, MetadataValue } from '@/domain/incident/metadata.js';
import type { Telemetry } from '@/domain/incident/telemetry.js';

const FORBIDDEN_METADATA_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

export type CreateIncidentInput = {
  id: string;
  timestamp: Date;
  source: string;
  service: string;
  environment: string;
  title: string;
  description: string;
  metadata?: Readonly<Record<string, unknown>>;
  telemetry?: Telemetry;
};

export function createIncident(input: CreateIncidentInput): Incident {
  if (Number.isNaN(input.timestamp.getTime())) {
    throw new InvalidIncidentError('Timestamp must be a valid date');
  }
  if (!isEnvironment(input.environment)) {
    throw new InvalidIncidentError('Environment is not supported');
  }

  return {
    id: incidentId(input.id),
    timestamp: input.timestamp,
    source: requiredText(input.source, 'Source', 100),
    service: requiredText(input.service, 'Service', 100),
    environment: input.environment,
    title: requiredText(input.title, 'Title', 200),
    description: boundedText(input.description, 'Description', 4000),
    metadata: copyMetadata(input.metadata),
    telemetry: copyTelemetry(input.telemetry),
  };
}

function requiredText(value: string, label: string, max: number): string {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    throw new InvalidIncidentError(`${label} is required`);
  }
  if (trimmed.length > max) {
    throw new InvalidIncidentError(`${label} is too long`);
  }
  return trimmed;
}

function boundedText(value: string, label: string, max: number): string {
  const trimmed = value.trim();
  if (trimmed.length > max) {
    throw new InvalidIncidentError(`${label} is too long`);
  }
  return trimmed;
}

function copyMetadata(metadata: Readonly<Record<string, unknown>> | undefined): Metadata {
  if (metadata === undefined) return {};
  const keys = Object.keys(metadata);
  if (keys.length > 20) {
    throw new InvalidIncidentError('Metadata supports at most 20 keys');
  }

  const copy: Record<string, MetadataValue> = {};
  for (const key of keys) {
    if (key.length === 0 || key.length > 64 || FORBIDDEN_METADATA_KEYS.has(key)) {
      throw new InvalidIncidentError('Metadata key is not supported');
    }
    const value = metadata[key];
    if (typeof value === 'string') {
      if (value.length > 500) throw new InvalidIncidentError('Metadata value is too long');
      copy[key] = value;
    } else if (typeof value === 'number') {
      if (!Number.isFinite(value)) throw new InvalidIncidentError('Metadata value must be finite');
      copy[key] = value;
    } else if (typeof value === 'boolean') {
      copy[key] = value;
    } else if (value !== undefined) {
      throw new InvalidIncidentError('Metadata values must be text, numbers, or booleans');
    }
  }
  return copy;
}

function copyTelemetry(telemetry: Telemetry | undefined): Telemetry {
  if (telemetry === undefined) return {};
  const copy: {
    latency?: number;
    errorRate?: number;
    cpu?: number;
    memory?: number;
    queueDepth?: number;
    statusCode?: number;
    exception?: string;
    logs?: readonly string[];
  } = {};

  const latency = takeNumber(telemetry.latency, 'Latency', 0, Number.POSITIVE_INFINITY, false);
  const errorRate = takeNumber(telemetry.errorRate, 'Error rate', 0, 1, false);
  const cpu = takeNumber(telemetry.cpu, 'CPU', 0, 100, false);
  const memory = takeNumber(telemetry.memory, 'Memory', 0, 100, false);
  const queueDepth = takeNumber(
    telemetry.queueDepth,
    'Queue depth',
    0,
    Number.POSITIVE_INFINITY,
    true,
  );
  const statusCode = takeNumber(telemetry.statusCode, 'Status code', 100, 599, true);

  if (latency !== undefined) copy.latency = latency;
  if (errorRate !== undefined) copy.errorRate = errorRate;
  if (cpu !== undefined) copy.cpu = cpu;
  if (memory !== undefined) copy.memory = memory;
  if (queueDepth !== undefined) copy.queueDepth = queueDepth;
  if (statusCode !== undefined) copy.statusCode = statusCode;
  if (telemetry.exception !== undefined) {
    if (telemetry.exception.length > 2000) {
      throw new InvalidIncidentError('Exception is too long');
    }
    copy.exception = telemetry.exception;
  }
  const logs = takeLogs(telemetry.logs);
  if (logs !== undefined) copy.logs = logs;
  return copy;
}

function takeNumber(
  value: number | undefined,
  label: string,
  min: number,
  max: number,
  integer: boolean,
): number | undefined {
  if (value === undefined) return undefined;
  const inRange =
    Number.isFinite(value) && value >= min && value <= max && (!integer || Number.isInteger(value));
  if (!inRange) {
    throw new InvalidIncidentError(`${label} is outside the supported range`);
  }
  return value;
}

function takeLogs(logs: readonly string[] | undefined): readonly string[] | undefined {
  if (logs === undefined) return undefined;
  if (logs.length > 20) {
    throw new InvalidIncidentError('Telemetry logs support at most 20 entries');
  }
  for (const entry of logs) {
    if (entry.length > 2000) {
      throw new InvalidIncidentError('A telemetry log entry is too long');
    }
  }
  return [...logs];
}
