import type { PageLoad } from './$types.js';

export const load: PageLoad = async ({ fetch }) => {
  try {
    const res = await fetch('/availableRoutesMap/world.json');
    if (!res.ok) {
      return { routesMap: {} as Record<string, string> };
    }
    const routesMap = (await res.json()) as Record<string, string>;
    return { routesMap };
  } catch (err) {
    console.error('Error loading world available routes:', err);
    return { routesMap: {} as Record<string, string> };
  }
};

export const ssr = false;
