import { describe, expect, it } from 'vitest';

import { aggregateConfidence } from '@/domain/decision/aggregate-confidence.js';
import { DecisionEngineError } from '@/domain/decision/errors.js';
import { createIncidentDecision } from '@/domain/decision/incident-decision.js';
import { scoreToSeverity } from '@/domain/decision/score-to-severity.js';

describe('scoreToSeverity', () => {
  it('maps the ends and a fractional midpoint of a four-level legend', () => {
    expect(scoreToSeverity(0, 4)).toBe(0);
    expect(scoreToSeverity(3, 4)).toBe(100);
    expect(scoreToSeverity(1.5, 4)).toBe(50);
  });

  it('rejects scores and legends outside the scale', () => {
    expect(() => scoreToSeverity(-0.1, 4)).toThrow(DecisionEngineError);
    expect(() => scoreToSeverity(3.1, 4)).toThrow(DecisionEngineError);
    expect(() => scoreToSeverity(Number.NaN, 4)).toThrow(DecisionEngineError);
    expect(() => scoreToSeverity(0, 1)).toThrow(DecisionEngineError);
    expect(() => scoreToSeverity(0, 2.5)).toThrow(DecisionEngineError);
  });
});

describe('aggregateConfidence', () => {
  it('uses the lower confidence', () => {
    expect(aggregateConfidence([0.95, 0.91])).toBe(0.91);
  });

  it('rejects an empty list or a value outside 0 to 1', () => {
    expect(() => aggregateConfidence([])).toThrow(DecisionEngineError);
    expect(() => aggregateConfidence([1.1])).toThrow(DecisionEngineError);
    expect(() => aggregateConfidence([Number.NaN])).toThrow(DecisionEngineError);
  });
});

describe('createIncidentDecision', () => {
  it('keeps a decision inside the domain scale', () => {
    expect(
      createIncidentDecision({
        domain: 'database',
        severity: 80,
        confidence: 0.91,
        engine: 'jev',
        model: ' recorded-fixture ',
      }),
    ).toMatchObject({
      domain: 'database',
      severity: 80,
      confidence: 0.91,
      model: 'recorded-fixture',
    });
  });

  it('rejects answers the engine is not allowed to invent', () => {
    const valid = {
      domain: 'database',
      severity: 80,
      confidence: 0.9,
      engine: 'jev',
      model: 'recorded-fixture',
    };
    expect(() => createIncidentDecision({ ...valid, domain: 'billing' })).toThrow(
      DecisionEngineError,
    );
    expect(() => createIncidentDecision({ ...valid, severity: 80.5 })).toThrow(DecisionEngineError);
    expect(() => createIncidentDecision({ ...valid, confidence: -0.1 })).toThrow(
      DecisionEngineError,
    );
    expect(() => createIncidentDecision({ ...valid, engine: 'rules' })).toThrow(
      DecisionEngineError,
    );
    expect(() => createIncidentDecision({ ...valid, model: '  ' })).toThrow(DecisionEngineError);
  });
});
