import { TypeSafeClient, type SystemOneResult } from '@typesafe-ai/sdk';

import { DecisionEngineError } from '@/domain/decision/errors.js';
import { incidentQuestions } from '@/infrastructure/jev/questions.js';
import { toJevState } from '@/infrastructure/jev/to-jev-state.js';
import type { IncidentContext } from '@/application/services/incident-context.js';

export type SystemOneCaller = {
  systemOne(context: IncidentContext): Promise<SystemOneResult<typeof incidentQuestions>>;
};

export function createTypeSafeCaller(model?: string): SystemOneCaller {
  let client: TypeSafeClient | undefined;

  return {
    async systemOne(context) {
      if (client === undefined) {
        try {
          client = new TypeSafeClient({
            logLevel: 'off',
            ...(model === undefined ? {} : { defaultModel: model }),
          });
        } catch (error) {
          throw new DecisionEngineError('The decision engine is not configured', { cause: error });
        }
      }

      return client.systemOne({
        state: toJevState(context),
        questions: incidentQuestions,
        ...(model === undefined ? {} : { model }),
      });
    },
  };
}
