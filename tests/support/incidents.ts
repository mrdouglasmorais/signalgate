import { createIncident, type CreateIncidentInput } from '@/domain/incident/create-incident.js';
import type { Incident } from '@/domain/incident/incident.js';

export function anIncident(overrides: Partial<CreateIncidentInput> = {}): Incident {
  return createIncident({
    id: 'inc_test',
    timestamp: new Date('2026-10-07T12:00:00.000Z'),
    source: 'prometheus',
    service: 'billing',
    environment: 'production',
    title: 'Latency rose',
    description: 'Checkout latency rose for five minutes.',
    metadata: {},
    telemetry: {},
    ...overrides,
  });
}
