import { describe, expect, it } from 'vitest';

import type { DecisionEngine } from '@/application/ports/decision-engine.js';
import { createIncidentDecision } from '@/domain/decision/incident-decision.js';
import { DecisionEngineError } from '@/domain/decision/errors.js';
import { buildApp } from '@/interfaces/http/app.js';
import { captureLogger } from '@tests/support/logger.js';

const body = {
  source: 'prometheus',
  service: 'billing-db',
  environment: 'production',
  title: 'Database latency spike',
  description: 'p95 query latency exceeded 2s.',
  metadata: { token: 'sekret', region: 'us-east-1' },
  telemetry: { latency: 2400, errorRate: 0.04 },
};

function engine(decision = page()): DecisionEngine {
  return {
    name: 'jev',
    async evaluate(context) {
      expect(context).not.toHaveProperty('metadata');
      return decision;
    },
  };
}

function page() {
  return createIncidentDecision({
    domain: 'database',
    severity: 92,
    confidence: 0.95,
    engine: 'jev',
    model: 'recorded-fixture',
  });
}

async function appWith(decisionEngine: DecisionEngine = engine()) {
  const captured = captureLogger();
  const app = await buildApp({
    logger: captured.logger,
    engine: decisionEngine,
    ids: () => 'inc_http',
    now: () => new Date('2026-10-07T12:00:00.000Z'),
    monotonic: sequence(0, 15),
  });
  return { app, lines: captured.lines };
}

function sequence(...values: number[]) {
  let index = 0;
  return () => {
    const value = values[index] ?? values[values.length - 1] ?? 0;
    index += 1;
    return value;
  };
}

describe('HTTP API', () => {
  it('reports health and echoes a valid request id', async () => {
    const { app, lines } = await appWith();
    const response = await app.inject({
      method: 'GET',
      url: '/health',
      headers: { 'x-request-id': 'req_123' },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: 'ok' });
    expect(response.headers['x-request-id']).toBe('req_123');
    expect(
      lines().some((line) => line.msg === 'request completed' && line.responseTimeMs !== undefined),
    ).toBe(true);
    await app.close();
  });

  it('reports ready the same way as health', async () => {
    const { app } = await appWith();
    const response = await app.inject({ method: 'GET', url: '/ready' });
    expect(response.json()).toEqual({ status: 'ready' });
    await app.close();
  });

  it('stores an incident and returns the latest policy decision', async () => {
    const { app, lines } = await appWith();
    const created = await app.inject({
      method: 'POST',
      url: '/incidents',
      payload: body,
      headers: { 'x-trace-id': 'trace_1' },
    });
    expect(created.statusCode).toBe(201);
    expect(created.json()).toMatchObject({
      id: 'inc_http',
      service: 'billing-db',
      metadata: { token: 'sekret', region: 'us-east-1' },
      telemetry: { latency: 2400, errorRate: 0.04 },
    });
    expect(
      lines().some((line) => line.event === 'incident.created' && line.traceId === 'trace_1'),
    ).toBe(true);

    const fetched = await app.inject({ method: 'GET', url: '/incidents/inc_http' });
    expect(fetched.statusCode).toBe(200);

    const evaluated = await app.inject({ method: 'POST', url: '/incidents/inc_http/evaluate' });
    expect(evaluated.statusCode).toBe(200);
    expect(evaluated.json()).toMatchObject({
      incidentId: 'inc_http',
      action: 'page',
      policyId: 'page',
      decisionEngine: 'jev',
      engineVersion: 'recorded-fixture',
      processingTime: 15,
      decision: { domain: 'database', severity: 92, confidence: 0.95 },
    });
    expect(evaluated.json().inputHash).toHaveLength(64);
    expect(
      lines().some((line) => line.event === 'incident.decision_recorded' && line.severity === 92),
    ).toBe(true);

    const again = await app.inject({ method: 'POST', url: '/incidents/inc_http/evaluate' });
    const latest = await app.inject({ method: 'GET', url: '/incidents/inc_http/decision' });
    expect(latest.json().timestamp).toBe(again.json().timestamp);
    await app.close();
  });

  it('simulates an incident that was not created first', async () => {
    const { app } = await appWith();
    const response = await app.inject({ method: 'POST', url: '/simulations', payload: body });
    expect(response.statusCode).toBe(200);
    expect(response.json().incident.id).toBe('inc_http');
    expect(response.json().decision.action).toBe('page');
    await app.close();
  });

  it('returns a safe body when the payload, the id, or the engine fails', async () => {
    const { app, lines } = await appWith({
      name: 'jev',
      async evaluate() {
        throw new DecisionEngineError('The decision engine failed');
      },
    });

    const invalid = await app.inject({
      method: 'POST',
      url: '/incidents',
      payload: { ...body, title: '   ' },
    });
    expect(invalid.statusCode).toBe(400);
    expect(invalid.json()).toMatchObject({
      code: 'invalid_incident',
      message: 'Title is required',
    });
    expect(invalid.body).not.toContain('stack');
    expect(lines().some((line) => line.event === 'incident.rejected')).toBe(true);

    const missing = await app.inject({ method: 'GET', url: '/incidents/missing' });
    expect(missing.statusCode).toBe(404);
    expect(missing.json().code).toBe('incident_not_found');

    const created = await app.inject({ method: 'POST', url: '/incidents', payload: body });
    const undecided = await app.inject({
      method: 'GET',
      url: `/incidents/${created.json().id}/decision`,
    });
    expect(undecided.statusCode).toBe(404);
    expect(undecided.json().code).toBe('decision_not_found');

    const failed = await app.inject({
      method: 'POST',
      url: `/incidents/${created.json().id}/evaluate`,
    });
    expect(failed.statusCode).toBe(502);
    expect(failed.json()).toMatchObject({
      code: 'decision_engine_error',
      message: 'The decision engine failed',
    });
    expect(failed.body).not.toContain('at ');
    expect(lines().some((line) => line.event === 'incident.decision_failed')).toBe(true);

    const junk = await app.inject({
      method: 'POST',
      url: '/incidents',
      headers: { 'content-type': 'application/json', 'x-request-id': 'not a token' },
      payload: '{',
    });
    expect(junk.statusCode).toBe(400);
    expect(junk.json().message).toBe('Invalid incident');
    expect(junk.headers['x-request-id']).not.toBe('not a token');

    const unknown = await app.inject({ method: 'GET', url: '/missing' });
    expect(unknown.statusCode).toBe(404);
    expect(unknown.json().code).toBe('not_found');
    await app.close();
  });
});
