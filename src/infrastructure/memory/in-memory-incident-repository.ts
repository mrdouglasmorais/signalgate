import type { IncidentRepository } from '@/application/ports/incident-repository.js';
import type { Incident } from '@/domain/incident/incident.js';

export class InMemoryIncidentRepository implements IncidentRepository {
  private readonly incidents = new Map<string, Incident>();

  save(incident: Incident): void {
    this.incidents.set(incident.id, incident);
  }

  findById(id: string): Incident | undefined {
    return this.incidents.get(id);
  }
}
