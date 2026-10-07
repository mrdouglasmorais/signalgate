import { describe, expect, it } from 'vitest';

import type { AppLogger } from '@/application/ports/app-logger.js';
import type { DecisionEngine } from '@/application/ports/decision-engine.js';
import { hashIncidentContext } from '@/application/services/hash-incident-context.js';
import {
  buildIncidentContext,
  type IncidentContext,
} from '@/application/services/incident-context.js';
import { createIncidentUseCase } from '@/application/use-cases/create-incident.js';
import { evaluateIncidentUseCase } from '@/application/use-cases/evaluate-incident.js';
import { getIncidentDecision } from '@/application/use-cases/get-incident-decision.js';
import { createIncidentDecision } from '@/domain/decision/incident-decision.js';
import type { IncidentDecision } from '@/domain/decision/incident-decision.js';
import { DecisionEngineError, DecisionNotFoundError } from '@/domain/decision/errors.js';
import { IncidentNotFoundError } from '@/domain/incident/errors.js';
import { PolicyEvaluationError } from '@/domain/policy/errors.js';
import { InMemoryDecisionRecordRepository } from '@/infrastructure/memory/in-memory-decision-record-repository.js';
import { InMemoryIncidentRepository } from '@/infrastructure/memory/in-memory-incident-repository.js';
import { anIncident } from '@tests/support/incidents.js';

const logger: AppLogger = {
  info() {},
  warn() {},
  error() {},
};

const command = {
  source: 'prometheus',
  service: 'billing',
  environment: 'production',
  title: 'Latency rose',
  description: 'Checkout latency rose.',
};

describe('createIncidentUseCase', () => {
  it('fills the id and the clock when the caller omits them', () => {
    const incidents = new InMemoryIncidentRepository();
    const incident = createIncidentUseCase(command, { incidents, logger });

    expect(incident.id.startsWith('inc_')).toBe(true);
    expect(incident.timestamp).toBeInstanceOf(Date);
    expect(incident.metadata).toEqual({});
    expect(incident.telemetry).toEqual({});
    expect(incidents.findById(incident.id)).toBe(incident);
  });

  it('keeps a supplied id, clock, metadata, and telemetry', () => {
    const incidents = new InMemoryIncidentRepository();
    const timestamp = new Date('2026-10-07T12:00:00.000Z');
    const incident = createIncidentUseCase(
      {
        ...command,
        timestamp,
        metadata: { paged: false },
        telemetry: { latency: 12 },
      },
      {
        incidents,
        logger,
        ids: () => 'inc_fixed',
        now: () => new Date('2020-01-01T00:00:00.000Z'),
      },
    );

    expect(incident.id).toBe('inc_fixed');
    expect(incident.timestamp).toBe(timestamp);
    expect(incident.metadata).toEqual({ paged: false });
    expect(incident.telemetry.latency).toBe(12);
  });
});

describe('evaluateIncidentUseCase', () => {
  it('rejects an unknown incident before calling the engine', async () => {
    await expect(
      evaluateIncidentUseCase(
        { incidentId: 'inc_missing' },
        {
          incidents: new InMemoryIncidentRepository(),
          decisions: new InMemoryDecisionRecordRepository(),
          engine: acceptingEngine(),
          logger,
        },
      ),
    ).rejects.toBeInstanceOf(IncidentNotFoundError);
  });

  it('records a decision with the default clock', async () => {
    const incidents = new InMemoryIncidentRepository();
    const decisions = new InMemoryDecisionRecordRepository();
    incidents.save(anIncident());

    const record = await evaluateIncidentUseCase(
      { incidentId: 'inc_test' },
      { incidents, decisions, engine: acceptingEngine(), logger },
    );

    expect(record.action).toBe('notify');
    expect(record.timestamp).toBeInstanceOf(Date);
    expect(record.processingTime).toBeGreaterThanOrEqual(0);
    expect(decisions.findLatestByIncidentId('inc_test')).toBe(record);
  });

  it('wraps an engine failure with the incident id', async () => {
    const incidents = new InMemoryIncidentRepository();
    incidents.save(anIncident());
    const cause = new DecisionEngineError('The decision engine is not configured');

    await expect(
      evaluateIncidentUseCase(
        { incidentId: 'inc_test' },
        {
          incidents,
          decisions: new InMemoryDecisionRecordRepository(),
          engine: failingEngine(cause),
          logger,
          now: () => new Date('2026-10-07T12:00:00.000Z'),
          monotonic: () => 0,
        },
      ),
    ).rejects.toMatchObject({
      message: 'The decision engine is not configured',
      incidentId: 'inc_test',
    });
  });

  it('hides an unexpected engine error', async () => {
    const incidents = new InMemoryIncidentRepository();
    incidents.save(anIncident());

    await expect(
      evaluateIncidentUseCase(
        { incidentId: 'inc_test' },
        {
          incidents,
          decisions: new InMemoryDecisionRecordRepository(),
          engine: failingEngine(new Error('vendor body: secret')),
          logger,
        },
      ),
    ).rejects.toThrow('The decision engine failed');
  });

  it('attaches the incident id when policy rejects the decision', async () => {
    const incidents = new InMemoryIncidentRepository();
    incidents.save(anIncident());
    // The factory cannot produce a severity outside 0 to 100. Policy still has to reject one.
    const invalid = {
      ...createIncidentDecision({
        domain: 'payments',
        severity: 80,
        confidence: 0.95,
        engine: 'jev',
        model: 'recorded-fixture',
      }),
      severity: 101,
    } as unknown as IncidentDecision;

    await expect(
      evaluateIncidentUseCase(
        { incidentId: 'inc_test' },
        {
          incidents,
          decisions: new InMemoryDecisionRecordRepository(),
          engine: acceptingEngine(invalid),
          logger,
        },
      ),
    ).rejects.toMatchObject({
      name: PolicyEvaluationError.name,
      incidentId: 'inc_test',
    });
  });
});

describe('getIncidentDecision', () => {
  it('rejects a missing incident before looking for a decision', () => {
    expect(() =>
      getIncidentDecision(
        'inc_missing',
        new InMemoryIncidentRepository(),
        new InMemoryDecisionRecordRepository(),
      ),
    ).toThrow(IncidentNotFoundError);
  });

  it('rejects an incident that has no recorded decision', () => {
    const incidents = new InMemoryIncidentRepository();
    incidents.save(anIncident());
    expect(() =>
      getIncidentDecision('inc_test', incidents, new InMemoryDecisionRecordRepository()),
    ).toThrow(DecisionNotFoundError);
  });
});

describe('hashIncidentContext edges', () => {
  it('hashes arrays, skips undefined fields, and replaces values JSON cannot encode', () => {
    const context = buildIncidentContext(anIncident({ telemetry: { logs: ['timeout', 'retry'] } }));
    // The hasher must stay defined for values the incident factory already rejects.
    const withHole = hashIncidentContext({
      ...context,
      telemetry: { ...context.telemetry, latency: undefined, logs: ['timeout', undefined] },
    } as unknown as IncidentContext);
    const withSymbol = hashIncidentContext({
      ...context,
      telemetry: { marker: Symbol('trace') },
    } as unknown as IncidentContext);

    expect(withHole).toHaveLength(64);
    expect(withSymbol).toHaveLength(64);
    expect(withHole).not.toBe(withSymbol);
  });
});

function acceptingEngine(decision?: IncidentDecision): DecisionEngine {
  return {
    name: 'jev',
    evaluate() {
      return Promise.resolve(
        decision ??
          createIncidentDecision({
            domain: 'payments',
            severity: 80,
            confidence: 0.95,
            engine: 'jev',
            model: 'recorded-fixture',
          }),
      );
    },
  };
}

function failingEngine(error: Error): DecisionEngine {
  return {
    name: 'jev',
    evaluate() {
      return Promise.reject(error);
    },
  };
}
