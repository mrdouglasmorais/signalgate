import type { Environment } from '@/domain/incident/environment.js';
import type { Incident } from '@/domain/incident/incident.js';
import type { Telemetry } from '@/domain/incident/telemetry.js';

export type IncidentContext = {
  readonly source: string;
  readonly service: string;
  readonly environment: Environment;
  readonly title: string;
  readonly description: string;
  readonly telemetry: Telemetry;
};

export function buildIncidentContext(incident: Incident): IncidentContext {
  return {
    source: incident.source,
    service: incident.service,
    environment: incident.environment,
    title: incident.title,
    description: incident.description,
    telemetry: { ...incident.telemetry },
  };
}
