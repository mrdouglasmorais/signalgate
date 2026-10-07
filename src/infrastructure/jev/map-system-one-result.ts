import type { SystemOneResult } from '@typesafe-ai/sdk';

import { aggregateConfidence } from '@/domain/decision/aggregate-confidence.js';
import { isIncidentDomain } from '@/domain/decision/domains.js';
import { DecisionEngineError } from '@/domain/decision/errors.js';
import {
  createIncidentDecision,
  type IncidentDecision,
} from '@/domain/decision/incident-decision.js';
import { scoreToSeverity } from '@/domain/decision/score-to-severity.js';
import { incidentQuestions } from '@/infrastructure/jev/questions.js';

export function mapSystemOneResult(
  result: SystemOneResult<typeof incidentQuestions>,
): IncidentDecision {
  const domainAnswer = result.answers.domain;
  const severityAnswer = result.answers.severity;
  if (domainAnswer.type !== 'choice' || severityAnswer.type !== 'score') {
    throw new DecisionEngineError('The decision engine returned an unexpected answer');
  }
  if (!isIncidentDomain(domainAnswer.choice)) {
    throw new DecisionEngineError('The decision engine returned an unknown domain');
  }

  // Confidence is the minimum of the choice and score confidences the SDK returned.
  const confidence = aggregateConfidence([domainAnswer.confidence, severityAnswer.confidence]);
  const severity = scoreToSeverity(
    severityAnswer.score,
    incidentQuestions.severity.criteria.length,
  );

  return createIncidentDecision({
    domain: domainAnswer.choice,
    severity,
    confidence,
    engine: 'jev',
    model: result.model,
  });
}
