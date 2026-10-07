import type { DecisionRecord } from '@/domain/decision/decision-record.js';

export type DecisionRecordRepository = {
  save(record: DecisionRecord): void;
  findLatestByIncidentId(incidentId: string): DecisionRecord | undefined;
};
