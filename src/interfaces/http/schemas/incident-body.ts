import { z } from 'zod';

import { InvalidIncidentError } from '@/domain/incident/errors.js';

const telemetrySchema = z
  .object({
    latency: z.number().optional(),
    errorRate: z.number().optional(),
    cpu: z.number().optional(),
    memory: z.number().optional(),
    queueDepth: z.number().optional(),
    statusCode: z.number().optional(),
    exception: z.string().optional(),
    logs: z.array(z.string()).optional(),
  })
  .strict();

export const incidentBodySchema = z
  .object({
    source: z.string(),
    service: z.string(),
    environment: z.enum(['production', 'staging', 'development']),
    title: z.string(),
    description: z.string(),
    timestamp: z.iso.datetime({ offset: true }).optional(),
    metadata: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
    telemetry: telemetrySchema.optional(),
  })
  .strict();

export type IncidentBody = z.infer<typeof incidentBodySchema>;

const incidentParamsSchema = z.object({ id: z.string().min(1) }).strict();

export function parseIncidentBody(body: unknown): IncidentBody {
  const parsed = incidentBodySchema.safeParse(body);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    throw new InvalidIncidentError(issue?.message ?? 'Invalid incident');
  }
  return parsed.data;
}

export function parseIncidentId(params: unknown): string {
  const parsed = incidentParamsSchema.safeParse(params);
  if (!parsed.success) {
    throw new InvalidIncidentError('Incident id is required');
  }
  return parsed.data.id;
}

export function parseTimestamp(value: string | undefined): Date | undefined {
  if (value === undefined) return undefined;
  const timestamp = new Date(value);
  if (Number.isNaN(timestamp.getTime())) {
    throw new InvalidIncidentError('Timestamp must be a valid date');
  }
  return timestamp;
}
