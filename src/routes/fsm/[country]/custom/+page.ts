import type { PageLoad } from './$types.js';
import type { ProvincesData } from '$lib/types.js';
import { stateResolution } from '$lib';
import { get } from 'svelte/store';

const PRESETS: Record<string, string[]> = {
	lesser_sunda: ['bali', 'nusa-tenggara-barat', 'nusa-tenggara-timur'],
    java: ['banten', 'dki-jakarta', 'jawa-barat', 'jawa-tengah', 'jawa-timur', 'daerah-istimewa-yogyakarta'],
    sumatra: ['aceh', 'sumatera-utara', 'sumatera-barat', 'riau', 'jambi', 'sumatera-selatan', 'bengkulu', 'lampung', 'kepulauan-riau', 'kepulauan-bangka-belitung'],
    kalimantan: ['kalimantan-barat', 'kalimantan-tengah', 'kalimantan-selatan', 'kalimantan-timur', 'kalimantan-utara'],
    sulawesi: ['sulawesi-utara', 'sulawesi-tengah', 'sulawesi-selatan', 'sulawesi-tenggara', 'sulawesi-barat', 'gorontalo'],
    maluku: ['maluku', 'maluku-utara'],
    papua: ['papua-barat', 'papua']
};

function parseStates(url: URL): string[] {
	const manualStates = url.searchParams
		.getAll('states')
		.flatMap((value) => value.split(','))
		.map((state) => state.trim().toLowerCase())
		.filter(Boolean);

	const presetName = url.searchParams.get('preset')?.trim().toLowerCase();
	const presetStates = presetName ? (PRESETS[presetName] ?? []) : [];

	return [...new Set([...presetStates, ...manualStates])];
}

export const load: PageLoad = async ({ params, url, fetch }) => {
	const country = params.country.trim().toLowerCase();
	const states = parseStates(url);

	if (states.length === 0) {
		return {
			provinces: {} as ProvincesData,
			loadError: 'Choose at least one state with ?states=... or ?preset=...'
		};
	}

	const loaded = await Promise.allSettled(
		states.map(async (state) => {
			const resolution = get(stateResolution);
			const res = await fetch(`/data/${country}/${resolution}/${state}.json`);

			if (!res.ok) {
				throw new Error(`${state}: ${res.status}`);
			}

			return (await res.json()) as GeoJSON.FeatureCollection;
		})
	);

	const failedStates: string[] = [];

	const combined: GeoJSON.FeatureCollection = {
		type: 'FeatureCollection',
		features: []
	};

	loaded.forEach((result, index) => {
		if (result.status === 'fulfilled') {
			combined.features.push(...result.value.features);
		} else {
			failedStates.push(states[index]);
		}
	});

	if (combined.features.length === 0) {
		return {
			provinces: {} as ProvincesData,
			loadError: `Could not load data for: ${states.join(', ')}.`
		};
	}

	const combinedName = states.map((state) => state.replaceAll('-', ' ')).join(' + ');

	return {
		provinces: {
			[combinedName]: combined
		} as ProvincesData,
		country,
		states,
		failedStates,
		loadError:
			failedStates.length > 0
				? `Some state data could not be loaded: ${failedStates.join(', ')}.`
				: undefined
	};
};