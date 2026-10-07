import type { Incident } from '@/domain/incident/incident.js';

export type IncidentRepository = {
  save(incident: Incident): void;
  findById(id: string): Incident | undefined;
};
