import type { DecisionEngine } from '@/application/ports/decision-engine.js';
import type { IncidentContext } from '@/application/services/incident-context.js';
import type { IncidentDecision } from '@/domain/decision/incident-decision.js';
import { DecisionEngineError } from '@/domain/decision/errors.js';
import { mapSystemOneResult } from '@/infrastructure/jev/map-system-one-result.js';
import type { SystemOneCaller } from '@/infrastructure/jev/system-one-caller.js';

export class JevDecisionEngine implements DecisionEngine {
  readonly name = 'jev' as const;

  constructor(private readonly caller: SystemOneCaller) {}

  async evaluate(context: IncidentContext): Promise<IncidentDecision> {
    try {
      const result = await this.caller.systemOne(context);
      return mapSystemOneResult(result);
    } catch (error) {
      if (error instanceof DecisionEngineError) throw error;
      throw new DecisionEngineError('The decision engine failed', { cause: error });
    }
  }
}
