import type { PageLoad } from './$types.js';
import type { ProvincesData } from '$lib/types.js';

/** Load province GeoJSON at route load time so the page receives it as a prop */
export const load: PageLoad = async ({ fetch }) => {
  const res = await fetch('/data.json');

  if (!res.ok) {
    return {
      provinces: null as ProvincesData | null,
      loadError: `Could not load data.json (HTTP ${res.status}). Place it in the static/ folder.`,
    };
  }

  const provinces = (await res.json()) as ProvincesData;
  return { provinces, loadError: null };
};

// Tell SvelteKit this is a client-side SPA — no server rendering needed.
export const ssr = false;
