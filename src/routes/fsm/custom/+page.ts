import type { PageLoad } from './$types.js';
import type { ProvincesData } from '$lib/types.js';
import { countryResolution } from '$lib';
import { get } from 'svelte/store';

const PRESETS: Record<string, string[]> = {
    "north-america": ["can", "usa", "mex", "gtm", "blz", "slv", "hnd", "nic", "cri", "pan"],
    "south-america": ["col", "ven", "guy", "sur", "bra", "ecu", "per", "bol", "chl", "arg", "ury", "pry"],
};

function parseCountries(url: URL): string[] {
	const manualStates = url.searchParams
		.getAll('countries')
		.flatMap((value) => value.split(','))
		.map((state) => state.trim().toLowerCase())
		.filter(Boolean);

	const presetName = url.searchParams.get('preset')?.trim().toLowerCase();
	const presetStates = presetName ? (PRESETS[presetName] ?? []) : [];

	return [...new Set([...presetStates, ...manualStates])];
}

export const load: PageLoad = async ({ params, url, fetch }) => {
	const countries = parseCountries(url);

	if (countries.length === 0) {
		return {
			provinces: {} as ProvincesData,
			loadError: 'Choose at least one state with ?states=... or ?preset=...'
		};
	}

	const loaded = await Promise.allSettled(
		countries.map(async (country) => {
			const resolution = get(countryResolution);
			const res = await fetch(`/data/${resolution}/${country}.json`);

			if (!res.ok) {
				throw new Error(`${country}: ${res.status}`);
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
			failedStates.push(countries[index]);
		}
	});

	if (combined.features.length === 0) {
		return {
			provinces: {} as ProvincesData,
			loadError: `Could not load data for: ${countries.join(', ')}.`
		};
	}

	const combinedName = countries.map((country) => country.replaceAll('-', ' ')).join(' + ');

	return {
		provinces: {
			[combinedName]: combined
		} as ProvincesData,
		countries,
		failedStates,
		loadError:
			failedStates.length > 0
				? `Some state data could not be loaded: ${failedStates.join(', ')}.`
				: undefined
	};
};