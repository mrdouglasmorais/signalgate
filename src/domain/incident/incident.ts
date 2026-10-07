import type { Environment } from '@/domain/incident/environment.js';
import type { IncidentId } from '@/domain/incident/incident-id.js';
import type { Metadata } from '@/domain/incident/metadata.js';
import type { Telemetry } from '@/domain/incident/telemetry.js';

export type Incident = {
  readonly id: IncidentId;
  readonly timestamp: Date;
  readonly source: string;
  readonly service: string;
  readonly environment: Environment;
  readonly title: string;
  readonly description: string;
  readonly metadata: Metadata;
  readonly telemetry: Telemetry;
};
