import { DecisionNotFoundError } from '@/domain/decision/errors.js';
import type { DecisionRecord } from '@/domain/decision/decision-record.js';
import { IncidentNotFoundError } from '@/domain/incident/errors.js';
import type { DecisionRecordRepository } from '@/application/ports/decision-record-repository.js';
import type { IncidentRepository } from '@/application/ports/incident-repository.js';

export function getIncidentDecision(
  id: string,
  incidents: IncidentRepository,
  decisions: DecisionRecordRepository,
): DecisionRecord {
  if (incidents.findById(id) === undefined) {
    throw new IncidentNotFoundError(id);
  }
  const record = decisions.findLatestByIncidentId(id);
  if (record === undefined) {
    throw new DecisionNotFoundError(id);
  }
  return record;
}
