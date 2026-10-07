import { describe, expect, it } from 'vitest';

import { readHost, readOptional, readPort } from '@/interfaces/http/config.js';
import { headerToken } from '@/interfaces/http/correlation.js';
import { mapError } from '@/interfaces/http/map-error.js';
import { DecisionEngineError } from '@/domain/decision/errors.js';
import { InvalidIncidentError } from '@/domain/incident/errors.js';

describe('http config', () => {
  it('defaults the port and host and rejects a port outside 0 to 65535', () => {
    expect(readPort(undefined)).toBe(3000);
    expect(readPort('  ')).toBe(3000);
    expect(readPort('8080')).toBe(8080);
    expect(() => readPort('70000')).toThrow(/PORT/);
    expect(readHost(undefined)).toBe('127.0.0.1');
    expect(readHost(' 0.0.0.0 ')).toBe('0.0.0.0');
    expect(readOptional('  ')).toBeUndefined();
    expect(readOptional('jev-1.13.0')).toBe('jev-1.13.0');
  });

  it('accepts only a short request token', () => {
    expect(headerToken('abc-123')).toBe('abc-123');
    expect(headerToken('has space')).toBeUndefined();
    expect(headerToken(['first-ok', 'second'])).toBe('first-ok');
    expect(headerToken(undefined)).toBeUndefined();
  });
});

describe('mapError', () => {
  it('hides unexpected failures and keeps domain messages', () => {
    expect(mapError(new InvalidIncidentError('Title is required'))).toMatchObject({
      statusCode: 400,
      code: 'invalid_incident',
      event: 'incident.rejected',
    });
    expect(
      mapError(new DecisionEngineError('The decision engine failed', { incidentId: 'inc_1' })),
    ).toMatchObject({
      statusCode: 502,
      event: 'incident.decision_failed',
      incidentId: 'inc_1',
      decisionEngine: 'jev',
    });
    expect(mapError(new Error('password in the stack'))).toEqual({
      statusCode: 500,
      code: 'internal_error',
      message: 'Internal error',
      level: 'error',
    });
    expect(mapError({ statusCode: 400 })).toMatchObject({
      statusCode: 400,
      message: 'Invalid incident',
    });
    expect(mapError({ statusCode: 404 })).toMatchObject({ code: 'not_found' });
    expect(mapError({ statusCode: '400' })).toMatchObject({ code: 'internal_error' });
  });
});
