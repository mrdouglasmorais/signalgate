import type { FastifyInstance, FastifyRequest } from 'fastify';

import { simulateIncidentUseCase } from '@/application/use-cases/simulate-incident.js';
import { headerToken } from '@/interfaces/http/correlation.js';
import { toDecisionResponse, toIncidentResponse } from '@/interfaces/http/presenters.js';
import { parseIncidentBody, parseTimestamp } from '@/interfaces/http/schemas/incident-body.js';
import type { IncidentRouteDependencies } from '@/interfaces/http/routes/incidents.js';

export function registerSimulationRoutes(
  app: FastifyInstance,
  dependencies: IncidentRouteDependencies,
): void {
  app.post('/simulations', async (request) => {
    const body = parseIncidentBody(request.body);
    const correlation = readCorrelation(request);
    const result = await simulateIncidentUseCase(
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
        decisions: dependencies.decisions,
        engine: dependencies.engine,
        logger: dependencies.loggerFor(request),
        ids: dependencies.ids,
        now: dependencies.now,
        monotonic: dependencies.monotonic,
      },
    );
    return {
      incident: toIncidentResponse(result.incident),
      decision: toDecisionResponse(result.record),
    };
  });
}

function readCorrelation(request: FastifyRequest): { requestId: string; traceId?: string } {
  const traceId = headerToken(request.headers['x-trace-id']);
  if (traceId === undefined) return { requestId: request.id };
  return { requestId: request.id, traceId };
}
