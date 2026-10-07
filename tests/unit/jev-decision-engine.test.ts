import { APIError, type SystemOneResult } from '@typesafe-ai/sdk';
import { describe, expect, it } from 'vitest';

import type { IncidentContext } from '@/application/services/incident-context.js';
import { buildIncidentContext } from '@/application/services/incident-context.js';
import { DecisionEngineError } from '@/domain/decision/errors.js';
import { applyPolicy } from '@/domain/policy/apply-policy.js';
import { JevDecisionEngine } from '@/infrastructure/jev/jev-decision-engine.js';
import { mapSystemOneResult } from '@/infrastructure/jev/map-system-one-result.js';
import { incidentQuestions } from '@/infrastructure/jev/questions.js';
import {
  createTypeSafeCaller,
  type SystemOneCaller,
} from '@/infrastructure/jev/system-one-caller.js';
import { anIncident } from '@tests/support/incidents.js';

const legend = incidentQuestions.severity.criteria;

function recordedResult(
  overrides: {
    choice?: 'database' | 'payments' | 'unknown';
    score?: number;
    domainConfidence?: number;
    severityConfidence?: number;
    model?: string;
  } = {},
): SystemOneResult<typeof incidentQuestions> {
  const choice = overrides.choice ?? 'database';
  return {
    model: overrides.model ?? 'recorded-fixture',
    usage: { input_tokens: 12, output_tokens: 2 },
    answers: {
      domain: {
        type: 'choice',
        choice,
        confidence: overrides.domainConfidence ?? 0.95,
        probabilities: {
          payments: 0.01,
          authentication: 0.01,
          infrastructure: 0.01,
          database: choice === 'database' ? 0.95 : 0.01,
          'external-provider': 0.01,
          unknown: choice === 'unknown' ? 0.95 : 0.01,
        },
      },
      severity: {
        type: 'score',
        score: overrides.score ?? 2.4,
        confidence: overrides.severityConfidence ?? 0.91,
        legend: {
          0: legend[0],
          1: legend[1],
          2: legend[2],
          3: legend[3],
        },
        probabilities: { 0: 0.05, 1: 0.1, 2: 0.45, 3: 0.4 },
      },
    },
  };
}

function caller(result: SystemOneResult<typeof incidentQuestions> | Error): SystemOneCaller & {
  state?: unknown;
} {
  const recorded: { state?: unknown } = {};
  return {
    ...recorded,
    async systemOne(context: IncidentContext) {
      recorded.state = context;
      this.state = context;
      if (result instanceof Error) throw result;
      return result;
    },
  };
}

describe('mapSystemOneResult', () => {
  it('maps a recorded systemOne payload into a decision the policy can apply', () => {
    const decision = mapSystemOneResult(recordedResult());
    expect(decision).toMatchObject({
      domain: 'database',
      severity: 80,
      confidence: 0.91,
      engine: 'jev',
      model: 'recorded-fixture',
    });
    expect(applyPolicy(decision).action).toBe('notify');
  });

  it('rejects an empty model and a score outside the legend', () => {
    expect(() => mapSystemOneResult(recordedResult({ model: ' ' }))).toThrow(DecisionEngineError);
    expect(() => mapSystemOneResult(recordedResult({ score: 9 }))).toThrow(DecisionEngineError);
    expect(() => mapSystemOneResult(recordedResult({ domainConfidence: 2 }))).toThrow(
      DecisionEngineError,
    );
  });
});

describe('JevDecisionEngine', () => {
  const context = buildIncidentContext(
    anIncident({ metadata: { token: 'sekret' }, telemetry: { latency: 2400 } }),
  );

  it('asks the caller with state that omits metadata', async () => {
    const gateway = caller(recordedResult());
    const engine = new JevDecisionEngine(gateway);
    const decision = await engine.evaluate(context);

    expect(decision.domain).toBe('database');
    expect(gateway.state).toMatchObject({ service: 'billing', telemetry: { latency: 2400 } });
    expect(gateway.state).not.toHaveProperty('metadata');
  });

  it('turns a transport failure into a decision error without the vendor body', async () => {
    const engine = new JevDecisionEngine(
      caller(new APIError(500, { detail: 'provider blew up' }, new Headers(), 'provider blew up')),
    );
    await expect(engine.evaluate(context)).rejects.toThrow(DecisionEngineError);
    await expect(engine.evaluate(context)).rejects.toThrow('The decision engine failed');
  });
});

describe('createTypeSafeCaller', () => {
  it('fails before the network when the API key is missing', async () => {
    const previous = process.env.TYPESAFE_API_KEY;
    delete process.env.TYPESAFE_API_KEY;
    try {
      const gateway = createTypeSafeCaller();
      await expect(gateway.systemOne(contextFromSupport())).rejects.toThrow(DecisionEngineError);
      await expect(gateway.systemOne(contextFromSupport())).rejects.toThrow(
        'The decision engine is not configured',
      );
    } finally {
      if (previous === undefined) delete process.env.TYPESAFE_API_KEY;
      else process.env.TYPESAFE_API_KEY = previous;
    }
  });
});

function contextFromSupport() {
  return buildIncidentContext(anIncident());
}
