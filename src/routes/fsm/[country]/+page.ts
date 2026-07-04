import type { PageLoad } from './$types.js';

export const load: PageLoad = async ({ params, fetch }) => {
  const { country } = params;
  try {
    const res = await fetch(`/data/${country}.json`);
    if (!res.ok) throw new Error(`${res.status}`);
    const provinces = await res.json();
    return { provinces };
  } catch (e) {
    return { provinces: null, loadError: `Could not load data for "${country}".` };
  }
};