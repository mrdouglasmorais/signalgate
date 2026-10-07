import type { IncidentId } from '@/domain/incident/incident-id.js';
import type { PolicyAction, PolicyRuleId } from '@/domain/policy/policy-outcome.js';
import type { IncidentDecision } from '@/domain/decision/incident-decision.js';

export type DecisionRecord = {
  readonly incidentId: IncidentId;
  readonly decision: IncidentDecision;
  readonly confidence: number;
  readonly decisionEngine: 'jev';
  readonly timestamp: Date;
  readonly processingTime: number;
  readonly engineVersion: string;
  readonly inputHash: string;
  readonly policyId: PolicyRuleId;
  readonly action: PolicyAction;
};
