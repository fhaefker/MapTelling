/**
 * deprecation.ts
 * Minimal deprecation guard (capabilities sec57) to surface one-time warnings for deprecated props/usages.
 */
const seen = new Set<string>();

export interface DeprecationOptions {
  feature: string; // e.g. 'MlGeoJsonLayer.paint'
  message?: string; // optional custom message
  onceKey?: string; // custom grouping key
}

export function warnDeprecated({ feature, message, onceKey }: DeprecationOptions) {
  const key = onceKey || feature;
  if (seen.has(key)) return;
  // eslint-disable-next-line no-console
  console.warn(`[DEPRECATION] ${feature} is deprecated.${message ? ' ' + message : ''}`);
  seen.add(key);
}

export default warnDeprecated;
