import { describe, expect, it } from 'vitest';

import { buildIncidentContext } from '@/application/services/incident-context.js';
import { hashIncidentContext } from '@/application/services/hash-incident-context.js';
import { anIncident } from '@tests/support/incidents.js';

describe('buildIncidentContext', () => {
  it('copies telemetry and leaves metadata out of the model state', () => {
    const incident = anIncident({
      metadata: { token: 'sekret' },
      telemetry: { latency: 2400 },
    });
    const context = buildIncidentContext(incident);

    expect(context.service).toBe(incident.service);
    expect(context.telemetry.latency).toBe(2400);
    expect('errorRate' in context.telemetry).toBe(false);
    expect('metadata' in context).toBe(false);
  });
});

describe('hashIncidentContext', () => {
  it('ignores key order and absent fields', () => {
    const left = hashIncidentContext(
      buildIncidentContext(anIncident({ telemetry: { cpu: 10, latency: 5 } })),
    );
    const right = hashIncidentContext(
      buildIncidentContext(anIncident({ telemetry: { latency: 5, cpu: 10 } })),
    );
    expect(left).toBe(right);
    expect(left).toHaveLength(64);
  });

  it('changes when the telemetry changes', () => {
    const calm = hashIncidentContext(buildIncidentContext(anIncident()));
    const hot = hashIncidentContext(buildIncidentContext(anIncident({ telemetry: { cpu: 99 } })));
    expect(calm).not.toBe(hot);
  });
});
