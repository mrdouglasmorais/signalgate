const REQUEST_TOKEN = /^[A-Za-z0-9._-]{1,128}$/;

export function headerToken(value: string | string[] | undefined): string | undefined {
  const first = Array.isArray(value) ? value[0] : value;
  if (first === undefined || !REQUEST_TOKEN.test(first)) return undefined;
  return first;
}
