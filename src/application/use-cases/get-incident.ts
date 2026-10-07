import { IncidentNotFoundError } from '@/domain/incident/errors.js';
import type { Incident } from '@/domain/incident/incident.js';
import type { IncidentRepository } from '@/application/ports/incident-repository.js';

export function getIncident(id: string, incidents: IncidentRepository): Incident {
  const incident = incidents.findById(id);
  if (incident === undefined) {
    throw new IncidentNotFoundError(id);
  }
  return incident;
}
