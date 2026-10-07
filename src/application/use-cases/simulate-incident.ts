import type { DecisionRecord } from '@/domain/decision/decision-record.js';
import type { Incident } from '@/domain/incident/incident.js';
import {
  createIncidentUseCase,
  type CreateIncidentCommand,
  type CreateIncidentDependencies,
} from '@/application/use-cases/create-incident.js';
import {
  evaluateIncidentUseCase,
  type EvaluateIncidentDependencies,
} from '@/application/use-cases/evaluate-incident.js';

export type SimulateIncidentDependencies = CreateIncidentDependencies &
  EvaluateIncidentDependencies;

export async function simulateIncidentUseCase(
  command: CreateIncidentCommand,
  dependencies: SimulateIncidentDependencies,
): Promise<{ incident: Incident; record: DecisionRecord }> {
  const incident = createIncidentUseCase(command, dependencies);
  const record = await evaluateIncidentUseCase(
    {
      incidentId: incident.id,
      requestId: command.requestId,
      traceId: command.traceId,
    },
    dependencies,
  );
  return { incident, record };
}
