<script lang="ts">
  import { displayName } from '$lib/utils/helpers.js';
  import type { AppMode } from '$lib/types.js';

  interface Props {
    provinceNames?:    string[];
    selectedProvince?: string;
    activeMode?:       AppMode;
    onprovinceChange?: (name: string) => void;
    onmodeChange?:     (mode: AppMode) => void;
  }

  let {
    provinceNames    = [],
    selectedProvince = '',
    activeMode       = 'explore',
    onprovinceChange,
    onmodeChange,
  }: Props = $props();

  const MODES: AppMode[] = ['explore', 'quiz', 'typing'];
</script>

<header
  class="flex items-center gap-4.5 px-5 py-3 flex-wrap z-20"
  style="background:var(--ink-surface); border-bottom:1px solid var(--border-hair);"
>
  <!-- Brand -->
  <div class="flex items-center gap-2.25">
    <svg style="color:var(--gold)" viewBox="0 0 24 24" width="24" height="24"
         fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true">
      <circle cx="12" cy="12" r="9.2"/>
      <path d="M12 2.4v2.4M12 19.2v2.4M2.4 12h2.4M19.2 12h2.4" stroke-width="1"/>
      <path d="M15.3 8.7l-2.1 5.1-5.1 2.1 2.1-5.1z" fill="currentColor" stroke="none"/>
    </svg>
    <div>
      <h1
        class="m-0 tracking-[0.01em] text-[1.35rem]"
        style="font-family:var(--font-display); font-style:italic; font-weight:600; color:var(--cream);"
      >Geo-Serg Geoguessr Trainer</h1>
      <span
        class="block mt-px text-[0.68rem] tracking-[0.04em]"
        style="font-family:var(--font-mono); color:var(--text-muted-dark);"
      >The Finite State Machine</span>
    </div>
  </div>

  <!-- Controls -->
  <div class="flex items-center gap-3.5 ml-auto flex-wrap">

    <!-- Province select -->
    <!-- <div class="relative">
      <select
        value={selectedProvince}
        onchange={(e: Event) =>
          onprovinceChange?.((e.currentTarget as HTMLSelectElement).value)}
        aria-label="Choose a province"
        class="appearance-none border rounded-lg py-2 pl-3 pr-9 font-medium text-[0.88rem] min-w-50"
        style="background:var(--ink-surface-2); color:var(--cream); border-color:var(--border-hair);
               font-family:var(--font-body);"
      >
        {#each provinceNames as name}
          <option value={name}>{displayName(name)}</option>
        {/each}
      </select>
      <span
        class="pointer-events-none absolute right-3 top-1/2 w-2 h-2 border-r-2 border-b-2"
        style="border-color:var(--text-muted-dark); transform:translateY(-65%) rotate(45deg);"
      ></span>
    </div> -->

    <!-- Mode toggle -->
    <div
      class="inline-flex rounded-full p-0.75 gap-0.5"
      style="background:var(--ink-surface-2);"
      role="group"
      aria-label="Game mode"
    >
      {#each MODES as m}
        <button
          type="button"
          class="rounded-full font-semibold text-[0.82rem] px-4 py-1.75 border-none"
          style={activeMode === m
            ? 'background:var(--gold); color:var(--ink-deep);'
            : 'background:transparent; color:var(--text-muted-dark);'}
          onclick={() => onmodeChange?.(m)}
        >
          {m.charAt(0).toUpperCase() + m.slice(1)}
        </button>
      {/each}
    </div>

  </div>
</header>
