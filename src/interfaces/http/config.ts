export function readPort(value: string | undefined): number {
  if (value === undefined || value.trim() === '') return 3000;
  const port = Number(value);
  if (!Number.isInteger(port) || port < 0 || port > 65535) {
    throw new Error('PORT must be an integer from 0 to 65535');
  }
  return port;
}

export function readHost(value: string | undefined): string {
  if (value === undefined || value.trim() === '') return '127.0.0.1';
  return value.trim();
}

export function readOptional(value: string | undefined): string | undefined {
  if (value === undefined) return undefined;
  const trimmed = value.trim();
  return trimmed.length === 0 ? undefined : trimmed;
}
