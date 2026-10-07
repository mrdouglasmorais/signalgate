export const INCIDENT_DOMAINS = [
  'payments',
  'authentication',
  'infrastructure',
  'database',
  'external-provider',
  'unknown',
] as const;

export type IncidentDomain = (typeof INCIDENT_DOMAINS)[number];

export function isIncidentDomain(value: string): value is IncidentDomain {
  return (INCIDENT_DOMAINS as readonly string[]).includes(value);
}
