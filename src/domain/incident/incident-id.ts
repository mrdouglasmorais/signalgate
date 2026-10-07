import { InvalidIncidentError } from '@/domain/incident/errors.js';

declare const incidentIdBrand: unique symbol;

export type IncidentId = string & { readonly [incidentIdBrand]: true };

export function incidentId(value: string): IncidentId {
  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed.length > 128) {
    throw new InvalidIncidentError('Incident id is required');
  }
  // Brand is a compile-time mark. The checks above are the runtime validation.
  return trimmed as IncidentId;
}
