import { browser } from '$app/environment';
import { writable, type Writable } from 'svelte/store';

export function persistentStore<T>(key: string, initialValue: T): Writable<T> {
  const storedValue = browser ? localStorage.getItem(key) : null;

  const store = writable<T>(
    storedValue ? (JSON.parse(storedValue) as T) : initialValue
  );

  if (browser) {
    store.subscribe((value) => {
      localStorage.setItem(key, JSON.stringify(value));
    });
  }

  return store;
}