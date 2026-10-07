import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));

export function resolve(specifier, context, nextResolve) {
  const file = resolveAlias(specifier);
  if (file === undefined) return nextResolve(specifier, context);
  return nextResolve(pathToFileURL(file).href, context);
}

function resolveAlias(specifier) {
  const folder = specifier.startsWith('@/')
    ? 'src'
    : specifier.startsWith('@tests/')
      ? 'tests'
      : undefined;
  if (folder === undefined) return undefined;

  const rest = specifier.startsWith('@/') ? specifier.slice(2) : specifier.slice('@tests/'.length);
  const candidate = join(root, folder, rest);
  if (existsSync(candidate)) return candidate;
  if (candidate.endsWith('.js')) {
    const typescript = `${candidate.slice(0, -3)}.ts`;
    if (existsSync(typescript)) return typescript;
  }
  return candidate;
}
