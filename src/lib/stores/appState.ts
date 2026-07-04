import { writable } from 'svelte/store';
import type { AppMode, FeedbackClass, SubdivisionItem, LayersById } from '$lib/types.js';

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