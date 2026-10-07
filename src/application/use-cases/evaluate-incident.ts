import { applyPolicy } from '@/domain/policy/apply-policy.js';
import type { DecisionRecord } from '@/domain/decision/decision-record.js';
import { DecisionEngineError } from '@/domain/decision/errors.js';
import { IncidentNotFoundError } from '@/domain/incident/errors.js';
import { PolicyEvaluationError } from '@/domain/policy/errors.js';
import type { AppLogger } from '@/application/ports/app-logger.js';
import type { DecisionEngine } from '@/application/ports/decision-engine.js';
import type { DecisionRecordRepository } from '@/application/ports/decision-record-repository.js';
import type { IncidentRepository } from '@/application/ports/incident-repository.js';
import { buildIncidentContext } from '@/application/services/incident-context.js';
import { hashIncidentContext } from '@/application/services/hash-incident-context.js';

export type EvaluateIncidentCommand = {
  incidentId: string;
  requestId?: string;
  traceId?: string;
};

export type EvaluateIncidentDependencies = {
  incidents: IncidentRepository;
  decisions: DecisionRecordRepository;
  engine: DecisionEngine;
  logger: AppLogger;
  now?: () => Date;
  monotonic?: () => number;
};

export async function evaluateIncidentUseCase(
  command: EvaluateIncidentCommand,
  dependencies: EvaluateIncidentDependencies,
): Promise<DecisionRecord> {
  const incident = dependencies.incidents.findById(command.incidentId);
  if (incident === undefined) {
    throw new IncidentNotFoundError(command.incidentId);
  }

  const context = buildIncidentContext(incident);
  dependencies.logger.info(
    {
      event: 'incident.evaluation_started',
      requestId: command.requestId,
      traceId: command.traceId,
      incidentId: incident.id,
      decisionEngine: dependencies.engine.name,
    },
    'Incident evaluation started',
  );

  const monotonic = dependencies.monotonic ?? performance.now.bind(performance);
  const started = monotonic();
  const decision = await evaluate(dependencies.engine, context, incident.id);
  const outcome = applyOutcome(decision, incident.id);
  const record: DecisionRecord = {
    incidentId: incident.id,
    decision,
    confidence: decision.confidence,
    decisionEngine: dependencies.engine.name,
    timestamp: dependencies.now?.() ?? new Date(),
    processingTime: Math.max(0, Math.round(monotonic() - started)),
    engineVersion: decision.model,
    inputHash: hashIncidentContext(context),
    policyId: outcome.ruleId,
    action: outcome.action,
  };

  dependencies.decisions.save(record);
  dependencies.logger.info(
    {
      event: 'incident.decision_recorded',
      requestId: command.requestId,
      traceId: command.traceId,
      incidentId: incident.id,
      decisionEngine: dependencies.engine.name,
      severity: decision.severity,
      confidence: decision.confidence,
    },
    'Incident decision recorded',
  );
  return record;
}

async function evaluate(
  engine: DecisionEngine,
  context: ReturnType<typeof buildIncidentContext>,
  incidentId: DecisionRecord['incidentId'],
) {
  try {
    return await engine.evaluate(context);
  } catch (error) {
    if (error instanceof DecisionEngineError) {
      throw new DecisionEngineError(error.message, { cause: error, incidentId });
    }
    throw new DecisionEngineError('The decision engine failed', { cause: error, incidentId });
  }
}

function applyOutcome(
  decision: DecisionRecord['decision'],
  incidentId: DecisionRecord['incidentId'],
) {
  try {
    return applyPolicy(decision);
  } catch (error) {
    if (error instanceof PolicyEvaluationError) {
      throw new PolicyEvaluationError(error.message, { incidentId });
    }
    throw error;
  }
}
