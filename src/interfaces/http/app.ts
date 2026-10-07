import { randomUUID } from 'node:crypto';

import Fastify, { LogController, type FastifyInstance } from 'fastify';
import type { Logger } from 'pino';

import type { DecisionEngine } from '@/application/ports/decision-engine.js';
import type { DecisionRecordRepository } from '@/application/ports/decision-record-repository.js';
import type { IncidentRepository } from '@/application/ports/incident-repository.js';
import { JevDecisionEngine } from '@/infrastructure/jev/jev-decision-engine.js';
import { createTypeSafeCaller } from '@/infrastructure/jev/system-one-caller.js';
import { createLogger } from '@/infrastructure/logging/create-logger.js';
import { toAppLogger } from '@/infrastructure/logging/to-app-logger.js';
import { InMemoryDecisionRecordRepository } from '@/infrastructure/memory/in-memory-decision-record-repository.js';
import { InMemoryIncidentRepository } from '@/infrastructure/memory/in-memory-incident-repository.js';
import { readOptional } from '@/interfaces/http/config.js';
import { headerToken } from '@/interfaces/http/correlation.js';
import { mapError } from '@/interfaces/http/map-error.js';
import { registerHealthRoutes } from '@/interfaces/http/routes/health.js';
import { registerIncidentRoutes } from '@/interfaces/http/routes/incidents.js';
import { registerSimulationRoutes } from '@/interfaces/http/routes/simulations.js';

export type BuildAppOptions = {
  logger?: Logger;
  incidents?: IncidentRepository;
  decisions?: DecisionRecordRepository;
  engine?: DecisionEngine;
  ids?: () => string;
  now?: () => Date;
  monotonic?: () => number;
  model?: string;
};

export async function buildApp(options: BuildAppOptions = {}) {
  const logger = options.logger ?? createLogger();
  const incidents = options.incidents ?? new InMemoryIncidentRepository();
  const decisions = options.decisions ?? new InMemoryDecisionRecordRepository();
  const engine =
    options.engine ??
    new JevDecisionEngine(
      createTypeSafeCaller(options.model ?? readOptional(process.env.JEV_MODEL)),
    );

  const app = Fastify({
    loggerInstance: logger,
    logController: new LogController({
      disableRequestLogging: true,
      requestIdLogLabel: 'requestId',
    }),
    requestIdHeader: false,
    genReqId(request) {
      return headerToken(request.headers['x-request-id']) ?? randomUUID();
    },
  });

  app.addHook('onRequest', async (request, reply) => {
    reply.header('x-request-id', request.id);
  });

  app.addHook('onResponse', async (request, reply) => {
    request.log.info(
      {
        requestId: request.id,
        method: request.method,
        url: request.url,
        statusCode: reply.statusCode,
        responseTimeMs: reply.elapsedTime,
      },
      'request completed',
    );
  });

  app.setNotFoundHandler((request, reply) => {
    request.log.warn({ requestId: request.id }, 'Not found');
    return reply.status(404).send({
      code: 'not_found',
      message: 'Not found',
      requestId: request.id,
    });
  });

  app.setErrorHandler((error, request, reply) => {
    const mapped = mapError(error);
    const fields = {
      ...(mapped.event === undefined ? {} : { event: mapped.event }),
      requestId: request.id,
      ...(mapped.incidentId === undefined ? {} : { incidentId: mapped.incidentId }),
      ...(mapped.decisionEngine === undefined ? {} : { decisionEngine: mapped.decisionEngine }),
      err: error,
    };
    if (mapped.level === 'error') request.log.error(fields, mapped.message);
    else request.log.warn(fields, mapped.message);

    return reply.status(mapped.statusCode).send({
      code: mapped.code,
      message: mapped.message,
      requestId: request.id,
    });
  });

  // Pino's Logger is not identical to FastifyBaseLogger. The instance is the one Fastify built.
  const http = app as unknown as FastifyInstance;
  registerHealthRoutes(http);
  const routes = {
    incidents,
    decisions,
    engine,
    loggerFor: (request: { log: Parameters<typeof toAppLogger>[0] }) => toAppLogger(request.log),
    ids: options.ids,
    now: options.now,
    monotonic: options.monotonic,
  };
  registerIncidentRoutes(http, routes);
  registerSimulationRoutes(http, routes);
  return app;
}
