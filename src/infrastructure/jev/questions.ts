import { choice, score } from '@typesafe-ai/sdk';

export const incidentQuestions = {
  domain: choice('Which domain owns this incident?', {
    payments: 'Charges, refunds, billing providers',
    authentication: 'Login, tokens, identity',
    infrastructure: 'Hosts, CPU, memory, network',
    database: 'Queries, connections, storage latency',
    'external-provider': 'A downstream SaaS or partner API',
    unknown: 'Not enough evidence to choose',
  }),
  severity: score('How severe is the incident?', [
    'No user impact',
    'Degraded for a subset of users',
    'Major user-facing failure',
    'Critical outage or data risk',
  ]),
};
