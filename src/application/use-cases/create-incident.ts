import { randomUUID } from 'node:crypto';

import { createIncident } from '@/domain/incident/create-incident.js';
import type { Incident } from '@/domain/incident/incident.js';
import type { AppLogger } from '@/application/ports/app-logger.js';
import type { IncidentRepository } from '@/application/ports/incident-repository.js';

export type CreateIncidentCommand = {
  requestId?: string;
  traceId?: string;
  source: string;
  service: string;
  environment: string;
  title: string;
  description: string;
  timestamp?: Date;
  metadata?: Readonly<Record<string, unknown>>;
  telemetry?: Incident['telemetry'];
};

export type CreateIncidentDependencies = {
  incidents: IncidentRepository;
  logger: AppLogger;
  ids?: () => string;
  now?: () => Date;
};

export function createIncidentUseCase(
  command: CreateIncidentCommand,
  dependencies: CreateIncidentDependencies,
): Incident {
  const incident = createIncident({
    id: dependencies.ids === undefined ? `inc_${randomUUID()}` : dependencies.ids(),
    timestamp: command.timestamp ?? dependencies.now?.() ?? new Date(),
    source: command.source,
    service: command.service,
    environment: command.environment,
    title: command.title,
    description: command.description,
    ...(command.metadata === undefined ? {} : { metadata: command.metadata }),
    ...(command.telemetry === undefined ? {} : { telemetry: command.telemetry }),
  });

  dependencies.incidents.save(incident);
  dependencies.logger.info(
    {
      event: 'incident.created',
      requestId: command.requestId,
      traceId: command.traceId,
      incidentId: incident.id,
    },
    'Incident stored',
  );
  return incident;
}
