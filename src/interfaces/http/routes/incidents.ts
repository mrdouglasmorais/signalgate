import type { FastifyInstance, FastifyRequest } from 'fastify';

import type { AppLogger } from '@/application/ports/app-logger.js';
import type { DecisionEngine } from '@/application/ports/decision-engine.js';
import type { DecisionRecordRepository } from '@/application/ports/decision-record-repository.js';
import type { IncidentRepository } from '@/application/ports/incident-repository.js';
import { createIncidentUseCase } from '@/application/use-cases/create-incident.js';
import { evaluateIncidentUseCase } from '@/application/use-cases/evaluate-incident.js';
import { getIncident } from '@/application/use-cases/get-incident.js';
import { getIncidentDecision } from '@/application/use-cases/get-incident-decision.js';
import { headerToken } from '@/interfaces/http/correlation.js';
import { toDecisionResponse, toIncidentResponse } from '@/interfaces/http/presenters.js';
import {
  parseIncidentBody,
  parseIncidentId,
  parseTimestamp,
} from '@/interfaces/http/schemas/incident-body.js';

export type IncidentRouteDependencies = {
  incidents: IncidentRepository;
  decisions: DecisionRecordRepository;
  engine: DecisionEngine;
  loggerFor: (request: FastifyRequest) => AppLogger;
  ids?: () => string;
  now?: () => Date;
  monotonic?: () => number;
};

export function registerIncidentRoutes(
  app: FastifyInstance,
  dependencies: IncidentRouteDependencies,
): void {
  app.post('/incidents', (request, reply) => {
    const body = parseIncidentBody(request.body);
    const correlation = readCorrelation(request);
    const incident = createIncidentUseCase(
      {
        ...correlation,
        source: body.source,
        service: body.service,
        environment: body.environment,
        title: body.title,
        description: body.description,
        timestamp: parseTimestamp(body.timestamp),
        metadata: body.metadata,
        telemetry: body.telemetry,
      },
      {
        incidents: dependencies.incidents,
        logger: dependencies.loggerFor(request),
        ids: dependencies.ids,
        now: dependencies.now,
      },
    );
    return reply.status(201).send(toIncidentResponse(incident));
  });

  app.get('/incidents/:id', (request) => {
    return toIncidentResponse(getIncident(parseIncidentId(request.params), dependencies.incidents));
  });

  app.post('/incidents/:id/evaluate', async (request) => {
    const record = await evaluateIncidentUseCase(
      {
        incidentId: parseIncidentId(request.params),
        ...readCorrelation(request),
      },
      {
        incidents: dependencies.incidents,
        decisions: dependencies.decisions,
        engine: dependencies.engine,
        logger: dependencies.loggerFor(request),
        now: dependencies.now,
        monotonic: dependencies.monotonic,
      },
    );
    return toDecisionResponse(record);
  });

  app.get('/incidents/:id/decision', (request) => {
    const record = getIncidentDecision(
      parseIncidentId(request.params),
      dependencies.incidents,
      dependencies.decisions,
    );
    return toDecisionResponse(record);
  });
}

function readCorrelation(request: FastifyRequest): { requestId: string; traceId?: string } {
  const traceId = headerToken(request.headers['x-trace-id']);
  if (traceId === undefined) return { requestId: request.id };
  return { requestId: request.id, traceId };
}
