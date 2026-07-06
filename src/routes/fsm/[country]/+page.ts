import type { PageLoad } from './$types.js';
import { countryResolution } from '$lib';
import { get } from 'svelte/store';

export const load: PageLoad = async ({ params, fetch }) => {
  const { country } = params;
  try {
    const resolution = get(countryResolution);
    const res = await fetch(`/data/${resolution}/${country}.json`);
    if (!res.ok) throw new Error(`${res.status}`);
    const provinces = await res.json();
    return { provinces };
  } catch (e) {
    return { provinces: null, loadError: `Could not load data for "${country}".` };
  }
};