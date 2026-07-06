<script lang="ts">
  import { onMount } from 'svelte';
  import {
    countryResolution,
    currentLevel,
    stateResolution,
    parentDivisionName
  } from '$lib';
  import type {
    AppMode,
    CountryResolution,
    StateResolution
  } from '$lib/types.js';

  interface Props {
    activeMode?: AppMode;
    onmodeChange?: (mode: AppMode) => void;
  }

  let {
    activeMode = 'explore',
    onmodeChange
  }: Props = $props();

  let settingsOpen = $state(false);
  let settingsEl = $state<HTMLDivElement | null>(null);

  let provinceRoutes = $state<Record<string, string>>({});
  let selectedProvince = $state('');

  let provinceNames = $derived(Object.keys(provinceRoutes).sort());

  const MODES: AppMode[] = ['explore', 'quiz', 'typing'];

  const COUNTRY_RESOLUTIONS: CountryResolution[] = [
    '500m',
    '1000m',
    '2000m',
    '5000m',
    '10000m',
    'full'
  ];

  const STATE_RESOLUTIONS: StateResolution[] = [
    '250m',
    '500m',
    '1000m',
    '2000m',
    'full'
  ];

  function displayName(name: string): string {
    return name.replace(/[-_]/g, ' ');
  }

  async function loadProvinceRoutes(divisionName: string | undefined) {
    if (!divisionName) {
      provinceRoutes = {};
      selectedProvince = '';
      return;
    }

    try {
      const response = await fetch(
        `/availableRoutesMap/${encodeURIComponent(divisionName)}.json`
      );

      if (!response.ok) {
        throw new Error(`Could not load province routes for ${divisionName}`);
      }

      provinceRoutes = await response.json();
      selectedProvince = '';
    } catch (error) {
      console.error(error);
      provinceRoutes = {};
      selectedProvince = '';
    }
  }

  function handleProvinceChange(event: Event) {
    const provinceName = (event.currentTarget as HTMLSelectElement).value;

    selectedProvince = provinceName;

    const route = provinceRoutes[provinceName];

    if (route) {
      window.location.assign(route);
    }
  }

  function setCountryResolution(event: Event) {
    const index = Number((event.currentTarget as HTMLInputElement).value);
    countryResolution.set(COUNTRY_RESOLUTIONS[index]);
  }

  function setStateResolution(event: Event) {
    const index = Number((event.currentTarget as HTMLInputElement).value);
    stateResolution.set(STATE_RESOLUTIONS[index]);
  }

  function countryResolutionIndex(value: CountryResolution) {
    return COUNTRY_RESOLUTIONS.indexOf(value);
  }

  function stateResolutionIndex(value: StateResolution) {
    return STATE_RESOLUTIONS.indexOf(value);
  }

  $effect(() => {
    const divisionName = $parentDivisionName;
    loadProvinceRoutes(divisionName ?? undefined);
  });

  onMount(() => {
    function handleDocumentClick(event: MouseEvent) {
      if (!settingsOpen || !settingsEl) return;

      if (!settingsEl.contains(event.target as Node)) {
        settingsOpen = false;
        window.location.reload();
      }
    }

    document.addEventListener('click', handleDocumentClick);

    return () => {
      document.removeEventListener('click', handleDocumentClick);
    };
  });
</script>

<header
  class="relative z-1000 flex items-center gap-4.5 px-5 py-3 flex-wrap"
  style="background:var(--ink-surface); border-bottom:1px solid var(--border-hair);"
>
  <div class="flex items-center gap-2.25">
    <svg
      style="color:var(--gold)"
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.4"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9.2" />
      <path
        d="M12 2.4v2.4M12 19.2v2.4M2.4 12h2.4M19.2 12h2.4"
        stroke-width="1"
      />
      <path
        d="M15.3 8.7l-2.1 5.1-5.1 2.1 2.1-5.1z"
        fill="currentColor"
        stroke="none"
      />
    </svg>

    <div>
      <h1
        class="m-0 tracking-[0.01em] text-[1.35rem]"
        style="font-family:var(--font-display); font-style:italic; font-weight:600; color:var(--cream);"
      >
        Geo-Serg Geoguessr Trainer
      </h1>

      <span
        class="block mt-px text-[0.68rem] tracking-[0.04em]"
        style="font-family:var(--font-mono); color:var(--text-muted-dark);"
      >
        The Finite State Machine
      </span>
    </div>
  </div>

  <div class="flex items-center gap-3.5 ml-auto flex-wrap">
    {#if provinceNames.length > 0}
      <div class="relative">
        <select
          value={selectedProvince}
          onchange={handleProvinceChange}
          aria-label="Choose a province"
          class="appearance-none border rounded-lg py-2 pl-3 pr-9 font-medium text-[0.88rem] min-w-50"
          style="background:var(--ink-surface-2); color:var(--cream); border-color:var(--border-hair); font-family:var(--font-body);"
        >
          <option value="" disabled>Select a province</option>

          {#each provinceNames as name}
            <option value={name}>{displayName(name)}</option>
          {/each}
        </select>

        <span
          class="pointer-events-none absolute right-3 top-1/2 w-2 h-2 border-r-2 border-b-2"
          style="border-color:var(--text-muted-dark); transform:translateY(-65%) rotate(45deg);"
        ></span>
      </div>
    {/if}

    <div
      class="inline-flex rounded-full p-0.75 gap-0.5"
      style="background:var(--ink-surface-2);"
      role="group"
      aria-label="Game mode"
    >
      {#each MODES as mode}
        <button
          type="button"
          class="rounded-full font-semibold text-[0.82rem] px-4 py-1.75 border-none"
          style={activeMode === mode
            ? 'background:var(--gold); color:var(--ink-deep);'
            : 'background:transparent; color:var(--text-muted-dark);'}
          onclick={() => onmodeChange?.(mode)}
        >
          {mode.charAt(0).toUpperCase() + mode.slice(1)}
        </button>
      {/each}
    </div>

    <div bind:this={settingsEl} class="relative">
      <button
        type="button"
        class="flex items-center justify-center w-9 h-9 rounded-full border-none leading-none text-xl"
        style="background:var(--ink-surface-2); color:var(--cream);"
        aria-label="Open settings"
        aria-expanded={settingsOpen}
        onclick={() => (settingsOpen = !settingsOpen)}
      >
        ⚙
      </button>

      {#if settingsOpen}
        <div
          class="fixed right-5 top-16 z-2000 w-72 rounded-xl p-4"
          style="background:var(--ink-surface-2); border:1px solid var(--border-hair); box-shadow:0 12px 30px rgba(0,0,0,.35);"
        >
          <p
            class="m-0 mb-1 text-[0.72rem] uppercase tracking-[0.12em]"
            style="color:var(--text-muted-dark); font-family:var(--font-mono);"
          >
            Resolution
          </p>

          {#if $currentLevel === 'adm1'}
            <div class="flex justify-between items-center mb-3">
              <span style="color:var(--cream);">Country boundaries</span>
              <strong style="color:var(--gold);">{$countryResolution}</strong>
            </div>

            <input
              type="range"
              min="0"
              max={COUNTRY_RESOLUTIONS.length - 1}
              step="1"
              value={countryResolutionIndex($countryResolution)}
              oninput={setCountryResolution}
              class="w-full"
              aria-label="Country resolution"
            />

            <div
              class="flex justify-between mt-2 text-[0.68rem]"
              style="color:var(--text-muted-dark);"
            >
              <span>{COUNTRY_RESOLUTIONS[0]}</span>
              <span>{COUNTRY_RESOLUTIONS[COUNTRY_RESOLUTIONS.length - 1]}</span>
            </div>
          {:else}
            <div class="flex justify-between items-center mb-3">
              <span style="color:var(--cream);">State boundaries</span>
              <strong style="color:var(--gold);">{$stateResolution}</strong>
            </div>

            <input
              type="range"
              min="0"
              max={STATE_RESOLUTIONS.length - 1}
              step="1"
              value={stateResolutionIndex($stateResolution)}
              oninput={setStateResolution}
              class="w-full"
              aria-label="State resolution"
            />

            <div
              class="flex justify-between mt-2 text-[0.68rem]"
              style="color:var(--text-muted-dark);"
            >
              <span>{STATE_RESOLUTIONS[0]}</span>
              <span>{STATE_RESOLUTIONS[STATE_RESOLUTIONS.length - 1]}</span>
            </div>
          {/if}
        </div>
      {/if}
    </div>
  </div>
</header>