import type { IncidentDecision } from '@/domain/decision/incident-decision.js';
import type { IncidentContext } from '@/application/services/incident-context.js';

export type DecisionEngineName = 'jev';

export type DecisionEngine = {
  readonly name: DecisionEngineName;
  evaluate(context: IncidentContext): Promise<IncidentDecision>;
};
