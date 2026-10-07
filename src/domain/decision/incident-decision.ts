import { isIncidentDomain, type IncidentDomain } from '@/domain/decision/domains.js';
import { DecisionEngineError } from '@/domain/decision/errors.js';

export type IncidentDecision = {
  readonly domain: IncidentDomain;
  readonly severity: number;
  readonly confidence: number;
  readonly engine: 'jev';
  readonly model: string;
};

export function createIncidentDecision(input: {
  domain: string;
  severity: number;
  confidence: number;
  engine: string;
  model: string;
}): IncidentDecision {
  if (!isIncidentDomain(input.domain)) {
    throw new DecisionEngineError('The decision engine returned an unknown domain');
  }
  if (!Number.isInteger(input.severity) || input.severity < 0 || input.severity > 100) {
    throw new DecisionEngineError('Severity must be an integer from 0 to 100');
  }
  if (!Number.isFinite(input.confidence) || input.confidence < 0 || input.confidence > 1) {
    throw new DecisionEngineError('Decision confidence is outside 0 to 1');
  }
  if (input.engine !== 'jev') {
    throw new DecisionEngineError('Unsupported decision engine');
  }
  const model = input.model.trim();
  if (model.length === 0) {
    throw new DecisionEngineError('Decision model is missing');
  }

  return {
    domain: input.domain,
    severity: input.severity,
    confidence: input.confidence,
    engine: 'jev',
    model,
  };
}
