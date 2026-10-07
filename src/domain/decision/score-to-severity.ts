import { DecisionEngineError } from '@/domain/decision/errors.js';

export function scoreToSeverity(score: number, levelCount: number): number {
  if (!Number.isInteger(levelCount) || levelCount < 2) {
    throw new DecisionEngineError('Severity legend is invalid');
  }
  const max = levelCount - 1;
  if (!Number.isFinite(score) || score < 0 || score > max) {
    throw new DecisionEngineError('Severity score is outside the legend');
  }
  return Math.round((score / max) * 100);
}
