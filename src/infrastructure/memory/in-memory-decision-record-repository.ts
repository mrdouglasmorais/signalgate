import type { DecisionRecordRepository } from '@/application/ports/decision-record-repository.js';
import type { DecisionRecord } from '@/domain/decision/decision-record.js';

export class InMemoryDecisionRecordRepository implements DecisionRecordRepository {
  private readonly records = new Map<string, DecisionRecord[]>();

  save(record: DecisionRecord): void {
    const existing = this.records.get(record.incidentId) ?? [];
    this.records.set(record.incidentId, [...existing, record]);
  }

  findLatestByIncidentId(incidentId: string): DecisionRecord | undefined {
    const existing = this.records.get(incidentId);
    const latest = existing?.[existing.length - 1];
    return latest;
  }
}
