import { DomainError } from '@/domain/domain-error.js';

export class PolicyEvaluationError extends DomainError {
  readonly code = 'policy_evaluation_error';
  readonly incidentId?: string;

  constructor(message: string, options?: { incidentId?: string }) {
    super(message);
    this.incidentId = options?.incidentId;
  }
}
