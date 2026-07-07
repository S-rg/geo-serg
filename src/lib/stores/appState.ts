import { writable } from 'svelte/store';
import type { AppMode, FeedbackClass, SubdivisionItem, LayersById, StateResolution, CountryResolution, CurrentLevel } from '$lib/types.js';
import { persistentStore } from './persistentStore';

export const mode = writable<AppMode>('explore');
export const province = writable<string | null>(null);
export const layersById = writable<LayersById>({});
export const completedIds = writable<Set<string>>(new Set());

// Quiz Stats
export const score      = writable<number>(0);
export const mistakes   = writable<number>(0);
export const skipped    = writable<number>(0);
export const streak     = writable<number>(0);
export const bestStreak = writable<number>(0);

// Quiz Runtime
export const quizQueue      = writable<SubdivisionItem[]>([]);
export const currentTarget  = writable<SubdivisionItem | null>(null);
export const wrongThisRound = writable<boolean>(false);

// UI Transients
export const feedbackText  = writable<string>('');
export const feedbackClass = writable<FeedbackClass>('');
export const showModal     = writable<boolean>(false);

export const currentLevel = writable<CurrentLevel>('adm1');
export const parentDivisionName = writable<string | null>(null);

export const labelsVisible = persistentStore<boolean>('labels-visible', true);

export const stateResolution = persistentStore<StateResolution>(
  'state-resolution',
  '500m'
);

export const countryResolution = persistentStore<CountryResolution>(
  'country-resolution',
  '1000m'
);