import { DecisionEngineError, DecisionNotFoundError } from '@/domain/decision/errors.js';
import { DomainError } from '@/domain/domain-error.js';
import { IncidentNotFoundError, InvalidIncidentError } from '@/domain/incident/errors.js';
import { PolicyEvaluationError } from '@/domain/policy/errors.js';

export type MappedError = {
  statusCode: number;
  code: string;
  message: string;
  level: 'warn' | 'error';
  event?: string;
  incidentId?: string;
  decisionEngine?: string;
};

export function mapError(error: unknown): MappedError {
  if (error instanceof InvalidIncidentError) {
    return {
      statusCode: 400,
      code: error.code,
      message: error.message,
      level: 'warn',
      event: 'incident.rejected',
    };
  }
  if (error instanceof IncidentNotFoundError) {
    return {
      statusCode: 404,
      code: error.code,
      message: error.message,
      level: 'warn',
      event: 'incident.not_found',
      incidentId: error.incidentId,
    };
  }
  if (error instanceof DecisionNotFoundError) {
    return {
      statusCode: 404,
      code: error.code,
      message: error.message,
      level: 'warn',
      incidentId: error.incidentId,
    };
  }
  if (error instanceof DecisionEngineError) {
    return {
      statusCode: 502,
      code: error.code,
      message: error.message,
      level: 'error',
      event: 'incident.decision_failed',
      incidentId: error.incidentId,
      decisionEngine: error.decisionEngine,
    };
  }
  if (error instanceof PolicyEvaluationError) {
    return {
      statusCode: 500,
      code: error.code,
      message: error.message,
      level: 'error',
      event: 'incident.decision_failed',
      incidentId: error.incidentId,
    };
  }
  if (error instanceof DomainError) {
    return { statusCode: 500, code: error.code, message: error.message, level: 'error' };
  }

  const statusCode = statusCodeOf(error);
  if (statusCode === 404) {
    return { statusCode: 404, code: 'not_found', message: 'Not found', level: 'warn' };
  }
  if (statusCode !== undefined && statusCode < 500) {
    return { statusCode, code: 'invalid_incident', message: 'Invalid incident', level: 'warn' };
  }
  return { statusCode: 500, code: 'internal_error', message: 'Internal error', level: 'error' };
}

function statusCodeOf(error: unknown): number | undefined {
  if (typeof error !== 'object' || error === null || !('statusCode' in error)) return undefined;
  const statusCode = error.statusCode;
  return typeof statusCode === 'number' ? statusCode : undefined;
}
