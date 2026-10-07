import type { DecisionRecord } from '@/domain/decision/decision-record.js';
import type { Incident } from '@/domain/incident/incident.js';

export function toIncidentResponse(incident: Incident) {
  return {
    id: incident.id,
    timestamp: incident.timestamp.toISOString(),
    source: incident.source,
    service: incident.service,
    environment: incident.environment,
    title: incident.title,
    description: incident.description,
    metadata: incident.metadata,
    telemetry: incident.telemetry,
  };
}

export function toDecisionResponse(record: DecisionRecord) {
  return {
    incidentId: record.incidentId,
    action: record.action,
    policyId: record.policyId,
    confidence: record.confidence,
    decisionEngine: record.decisionEngine,
    engineVersion: record.engineVersion,
    processingTime: record.processingTime,
    inputHash: record.inputHash,
    timestamp: record.timestamp.toISOString(),
    decision: record.decision,
  };
}
