import { describe, expect, it } from 'vitest';

import { createIncidentDecision } from '@/domain/decision/incident-decision.js';
import type { IncidentDecision } from '@/domain/decision/incident-decision.js';
import { applyPolicy } from '@/domain/policy/apply-policy.js';
import { PolicyEvaluationError } from '@/domain/policy/errors.js';

function decision(overrides: Partial<IncidentDecision> = {}): IncidentDecision {
  return {
    ...createIncidentDecision({
      domain: 'payments',
      severity: 50,
      confidence: 0.8,
      engine: 'jev',
      model: 'recorded-fixture',
    }),
    ...overrides,
  };
}

describe('applyPolicy', () => {
  it.each([
    [{ confidence: 0.59, severity: 99 }, 'human_review', 'low-confidence'],
    [
      { confidence: 0.6, domain: 'unknown' as const, severity: 99 },
      'human_review',
      'unknown-domain',
    ],
    [{ confidence: 0.9, severity: 90 }, 'page', 'page'],
    [{ confidence: 0.89, severity: 90 }, 'notify', 'notify'],
    [{ confidence: 0.9, severity: 89 }, 'notify', 'notify'],
    [{ confidence: 0.6, severity: 70 }, 'notify', 'notify'],
    [{ confidence: 0.6, severity: 69 }, 'none', 'none'],
  ] as const)('matches the precedence row %j', (overrides, action, ruleId) => {
    expect(applyPolicy(decision(overrides))).toEqual({ action, ruleId });
  });

  it('rejects a severity the factory would not produce', () => {
    expect(() => applyPolicy(decision({ severity: 101 }))).toThrow(PolicyEvaluationError);
  });

  it('rejects a confidence outside 0 to 1', () => {
    expect(() => applyPolicy(decision({ confidence: 1.2 }))).toThrow(PolicyEvaluationError);
    expect(() => applyPolicy(decision({ confidence: Number.NaN }))).toThrow(PolicyEvaluationError);
  });

  it('rejects a domain that bypassed the factory', () => {
    const forged = decision();
    // The factory cannot produce this domain. The cast checks the runtime guard.
    const invalid = { ...forged, domain: 'billing' } as unknown as IncidentDecision;
    expect(() => applyPolicy(invalid)).toThrow(PolicyEvaluationError);
  });
});
