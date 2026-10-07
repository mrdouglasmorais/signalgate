import { DomainError } from '@/domain/domain-error.js';

export class InvalidIncidentError extends DomainError {
  readonly code = 'invalid_incident';

  constructor(message: string) {
    super(message);
  }
}

export class IncidentNotFoundError extends DomainError {
  readonly code = 'incident_not_found';
  readonly incidentId: string;

  constructor(incidentId: string) {
    super(`Incident ${incidentId} was not found`);
    this.incidentId = incidentId;
  }
}
