import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { buildIncidentContext } from '@/application/services/incident-context.js';
import { createIncidentDecision } from '@/domain/decision/incident-decision.js';
import { createIncident } from '@/domain/incident/create-incident.js';
import { applyPolicy } from '@/domain/policy/apply-policy.js';

const fixtures = path.join(path.dirname(fileURLToPath(import.meta.url)), '../fixtures');

type Scenario = {
  name: string;
  incident: string;
  recordedDecision: {
    domain: string;
    severity: number;
    confidence: number;
    engine: string;
    model: string;
  };
  expected: { action: string; ruleId: string };
};

function readJson(file: string): unknown {
  return JSON.parse(readFileSync(file, 'utf8')) as unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function loadIncident(name: string) {
  const value = readJson(path.join(fixtures, 'incidents', name));
  if (!isRecord(value) || typeof value.timestamp !== 'string') {
    throw new Error(`Incident fixture ${name} is not an object`);
  }
  return createIncident({
    id: String(value.id),
    timestamp: new Date(value.timestamp),
    source: String(value.source),
    service: String(value.service),
    environment: String(value.environment),
    title: String(value.title),
    description: String(value.description),
    metadata: isRecord(value.metadata) ? value.metadata : {},
    telemetry: isRecord(value.telemetry) ? value.telemetry : {},
  });
}

function loadScenarios(): Scenario[] {
  return readdirSync(path.join(fixtures, 'scenarios'))
    .filter((file) => file.endsWith('.json'))
    .map((file) => {
      const value = readJson(path.join(fixtures, 'scenarios', file));
      if (!isRecord(value) || !isRecord(value.recordedDecision) || !isRecord(value.expected)) {
        throw new Error(`Scenario ${file} is incomplete`);
      }
      const recorded = value.recordedDecision;
      const expected = value.expected;
      return {
        name: String(value.name),
        incident: String(value.incident),
        recordedDecision: {
          domain: String(recorded.domain),
          severity: Number(recorded.severity),
          confidence: Number(recorded.confidence),
          engine: String(recorded.engine),
          model: String(recorded.model),
        },
        expected: { action: String(expected.action), ruleId: String(expected.ruleId) },
      };
    });
}

describe('incident scenarios', () => {
  it.each(loadScenarios())('$name applies the recorded decision', (scenario) => {
    const incident = loadIncident(scenario.incident);
    const context = buildIncidentContext(incident);
    const decision = createIncidentDecision(scenario.recordedDecision);

    expect(context.service).toBe(incident.service);
    expect('metadata' in context).toBe(false);
    expect(applyPolicy(decision)).toEqual(scenario.expected);
  });
});
