import { describe, expect, it } from 'vitest';

import { createIncident } from '@/domain/incident/create-incident.js';
import { InvalidIncidentError } from '@/domain/incident/errors.js';
import { anIncident } from '@tests/support/incidents.js';

const valid = {
  id: 'inc_test',
  timestamp: new Date('2026-10-07T12:00:00.000Z'),
  source: 'prometheus',
  service: 'billing',
  environment: 'production',
  title: 'Latency rose',
  description: 'Checkout latency rose.',
};

describe('createIncident', () => {
  it('keeps absent telemetry absent', () => {
    const incident = anIncident({ telemetry: { latency: 10 } });
    expect(incident.telemetry.latency).toBe(10);
    expect(incident.telemetry.errorRate).toBeUndefined();
    expect('errorRate' in incident.telemetry).toBe(false);
  });

  it('trims text and defaults missing metadata', () => {
    const incident = createIncident({ ...valid, title: '  Latency  ', source: ' prometheus ' });
    expect(incident.title).toBe('Latency');
    expect(incident.source).toBe('prometheus');
    expect(incident.metadata).toEqual({});
  });

  it('rejects blank identity, a bad clock value, and an unknown environment', () => {
    expect(() => createIncident({ ...valid, title: '   ' })).toThrow(InvalidIncidentError);
    expect(() => createIncident({ ...valid, id: '   ' })).toThrow(InvalidIncidentError);
    expect(() => createIncident({ ...valid, timestamp: new Date('nope') })).toThrow(
      InvalidIncidentError,
    );
    expect(() => createIncident({ ...valid, environment: 'qa' })).toThrow(InvalidIncidentError);
  });

  it('rejects telemetry and metadata outside the supported shape', () => {
    expect(() => anIncident({ telemetry: { latency: -1 } })).toThrow(InvalidIncidentError);
    expect(() => anIncident({ telemetry: { errorRate: 1.4 } })).toThrow(InvalidIncidentError);
    expect(() => anIncident({ telemetry: { queueDepth: 1.2 } })).toThrow(InvalidIncidentError);
    expect(() => anIncident({ telemetry: { statusCode: 99 } })).toThrow(InvalidIncidentError);
    expect(() => anIncident({ telemetry: { exception: 'x'.repeat(2001) } })).toThrow(
      InvalidIncidentError,
    );
    expect(() =>
      anIncident({ telemetry: { logs: Array.from({ length: 21 }, () => 'line') } }),
    ).toThrow(InvalidIncidentError);
    expect(() => anIncident({ telemetry: { logs: ['x'.repeat(2001)] } })).toThrow(
      InvalidIncidentError,
    );
    expect(() => anIncident({ metadata: { constructor: 'no' } })).toThrow(InvalidIncidentError);
    expect(() => anIncident({ metadata: { token: 'x'.repeat(501) } })).toThrow(
      InvalidIncidentError,
    );
    expect(() => anIncident({ metadata: { ratio: Number.NaN } })).toThrow(InvalidIncidentError);
    expect(() => anIncident({ metadata: { nested: { owner: 'ops' } } })).toThrow(
      InvalidIncidentError,
    );
    expect(() =>
      anIncident({
        metadata: Object.fromEntries(Array.from({ length: 21 }, (_, index) => [`k${index}`, 1])),
      }),
    ).toThrow(InvalidIncidentError);
  });

  it('keeps boolean metadata and a finite number', () => {
    const incident = anIncident({ metadata: { paged: false, attempts: 2 } });
    expect(incident.metadata).toEqual({ paged: false, attempts: 2 });
  });
});
