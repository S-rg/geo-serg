import { stateResolution } from '$lib';
import type { PageLoad } from './$types.js';
import { get } from 'svelte/store';

export const load: PageLoad = async ({ params, fetch }) => {
  const { country, state } = params;
  try {
    const resolution = get(stateResolution);
    const res = await fetch(`/data/${country}/${resolution}/${state}.json`);
    if (!res.ok) throw new Error(`${res.status}`);
    const provinces = await res.json();
    return { provinces };
  } catch (e) {
    return { provinces: null, loadError: `Could not load data for "${country}/${state}".` };
  }
};