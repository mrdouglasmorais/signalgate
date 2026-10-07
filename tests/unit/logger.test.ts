import { describe, expect, it } from 'vitest';

import { REDACTED } from '@/infrastructure/logging/create-logger.js';
import { captureLogger } from '@tests/support/logger.js';

describe('createLogger', () => {
  it('writes JSON with the service name and censors credentials', () => {
    const { logger, lines } = captureLogger();
    logger.info(
      {
        token: 'sekret',
        apiKey: 'tsk_live',
        authorization: 'Bearer sekret',
        metadata: { password: 'pw', region: 'us-east-1' },
      },
      'check',
    );

    const line = lines()[0];
    expect(line?.service).toBe('signalgate');
    expect(line?.token).toBe(REDACTED);
    expect(line?.apiKey).toBe(REDACTED);
    expect(line?.authorization).toBe(REDACTED);
    expect(line?.metadata).toEqual({ password: REDACTED, region: 'us-east-1' });
    expect(JSON.stringify(line)).not.toContain('sekret');
    expect(JSON.stringify(line)).not.toContain('tsk_live');
  });
});
