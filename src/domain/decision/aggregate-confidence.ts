import { DecisionEngineError } from '@/domain/decision/errors.js';

export function aggregateConfidence(values: readonly number[]): number {
  const first = values[0];
  if (first === undefined) {
    throw new DecisionEngineError('Decision confidence is missing');
  }

  let lowest = first;
  for (const value of values) {
    if (!Number.isFinite(value) || value < 0 || value > 1) {
      throw new DecisionEngineError('Decision confidence is outside 0 to 1');
    }
    if (value < lowest) lowest = value;
  }
  return lowest;
}
