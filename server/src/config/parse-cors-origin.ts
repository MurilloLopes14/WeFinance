export function parseCorsOrigin(
  value?: string,
): string | string[] | undefined {
  if (!value) {
    return undefined;
  }

  if (value === '*') {
    return undefined;
  }

  const origins = value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (origins.length === 0) {
    return undefined;
  }

  return origins.length === 1 ? origins[0] : origins;
}
