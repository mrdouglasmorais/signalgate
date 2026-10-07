import type { JsonValue } from '@typesafe-ai/sdk';

import type { IncidentContext } from '@/application/services/incident-context.js';
import type { Telemetry } from '@/domain/incident/telemetry.js';

export function toJevState(context: IncidentContext): { [key: string]: JsonValue } {
  return {
    source: context.source,
    service: context.service,
    environment: context.environment,
    title: context.title,
    description: context.description,
    telemetry: telemetryState(context.telemetry),
  };
}

function telemetryState(telemetry: Telemetry): { [key: string]: JsonValue } {
  const state: { [key: string]: JsonValue } = {};
  if (telemetry.latency !== undefined) state.latency = telemetry.latency;
  if (telemetry.errorRate !== undefined) state.errorRate = telemetry.errorRate;
  if (telemetry.cpu !== undefined) state.cpu = telemetry.cpu;
  if (telemetry.memory !== undefined) state.memory = telemetry.memory;
  if (telemetry.queueDepth !== undefined) state.queueDepth = telemetry.queueDepth;
  if (telemetry.statusCode !== undefined) state.statusCode = telemetry.statusCode;
  if (telemetry.exception !== undefined) state.exception = telemetry.exception;
  if (telemetry.logs !== undefined) state.logs = [...telemetry.logs];
  return state;
}
