import { isIncidentDomain } from '@/domain/decision/domains.js';
import type { IncidentDecision } from '@/domain/decision/incident-decision.js';
import { PolicyEvaluationError } from '@/domain/policy/errors.js';
import type { PolicyOutcome } from '@/domain/policy/policy-outcome.js';

export function applyPolicy(decision: IncidentDecision): PolicyOutcome {
  assertSupported(decision);

  if (decision.confidence < 0.6) {
    return { action: 'human_review', ruleId: 'low-confidence' };
  }
  if (decision.domain === 'unknown') {
    return { action: 'human_review', ruleId: 'unknown-domain' };
  }
  if (decision.severity >= 90 && decision.confidence >= 0.9) {
    return { action: 'page', ruleId: 'page' };
  }
  if (decision.severity >= 70) {
    return { action: 'notify', ruleId: 'notify' };
  }
  return { action: 'none', ruleId: 'none' };
}

function assertSupported(decision: IncidentDecision): void {
  if (!isIncidentDomain(decision.domain)) {
    throw new PolicyEvaluationError('Policy received an unknown domain');
  }
  if (!Number.isInteger(decision.severity) || decision.severity < 0 || decision.severity > 100) {
    throw new PolicyEvaluationError('Policy received a severity outside 0 to 100');
  }
  if (!Number.isFinite(decision.confidence) || decision.confidence < 0 || decision.confidence > 1) {
    throw new PolicyEvaluationError('Policy received a confidence outside 0 to 1');
  }
}
