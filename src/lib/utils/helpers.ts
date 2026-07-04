export function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const DISPLAY_NAME_OVERRIDES: Record<string, string> = {
  'Dki Jakarta': 'DKI Jakarta',
};

export function displayName(name: string): string {
  return DISPLAY_NAME_OVERRIDES[name] ?? name;
}

export const REDUCED_MOTION: boolean =
  typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;
