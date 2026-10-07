import { DomainError } from '@/domain/domain-error.js';

export class DecisionEngineError extends DomainError {
  readonly code = 'decision_engine_error';
  readonly decisionEngine = 'jev' as const;
  readonly incidentId?: string;

  constructor(message: string, options?: { cause?: unknown; incidentId?: string }) {
    super(message, options?.cause === undefined ? undefined : { cause: options.cause });
    this.incidentId = options?.incidentId;
  }
}

export class DecisionNotFoundError extends DomainError {
  readonly code = 'decision_not_found';
  readonly incidentId: string;

  constructor(incidentId: string) {
    super('No decision has been recorded for this incident');
    this.incidentId = incidentId;
  }
}
