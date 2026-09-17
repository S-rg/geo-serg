<script lang="ts">
  import { onMount, onDestroy } from 'svelte';

  interface NeighborOption {
    code: string;
    name: string;
    route: string;
  }

  interface Props {
    countryName?:   string;
    total?:         number;
    onrestart?:     () => void;
  }

  let {
    countryName  = '',
    total        = 0,
    onrestart,
  }: Props = $props();

  let showNext       = $state(false);
  let neighbors      = $state<NeighborOption[]>([]);
  let loadingNeighbors = $state(false);

  /** Look up the current country's code from the URL path */
  function currentCountryCode(): string {
    const parts = window.location.pathname.split('/').filter(Boolean);
    // URL: /fsm/<code>  =>  parts = ['fsm', '<code>']
    return parts.length >= 2 ? parts[1] : '';
  }

  async function loadNeighbors(): Promise<void> {
    loadingNeighbors = true;
    try {
      const [neighborsRes, routesRes] = await Promise.all([
        fetch('/data/neighbors.json'),
        fetch('/availableRoutesMap/world.json'),
      ]);
      if (!neighborsRes.ok || !routesRes.ok) return;

      const neighborsMap: Record<string, string[]> = await neighborsRes.json();
      const routesMap: Record<string, string> = await routesRes.json();

      // Build code -> {name, route} lookup
      const codeToInfo: Record<string, { name: string; route: string }> = {};
      for (const [name, route] of Object.entries(routesMap)) {
        const code = route.split('/').pop()!;
        codeToInfo[code] = { name, route };
      }

      const code = currentCountryCode();
      const neighborCodes = neighborsMap[code] ?? [];

      neighbors = neighborCodes
        .map(nc => {
          const info = codeToInfo[nc];
          return info ? { code: nc, name: info.name, route: info.route } : null;
        })
        .filter((n): n is NeighborOption => n !== null);
    } finally {
      loadingNeighbors = false;
    }
  }

  function handleKeydown(event: KeyboardEvent): void {
    // Ignore if user is in an input
    const active = document.activeElement as HTMLElement | null;
    if (active?.closest('input, textarea, select, [contenteditable="true"]')) return;

    const key = event.key.toLowerCase();

    if (!showNext) {
      if (key === 'r') {
        event.preventDefault();
        onrestart?.();
      } else if (key === 'n') {
        event.preventDefault();
        showNext = true;
        loadNeighbors();
      }
    } else {
      if (key === 'escape' || key === 'backspace') {
        event.preventDefault();
        showNext = false;
      }
      // Number keys 1-9 to select a neighbor
      const num = parseInt(key);
      if (num >= 1 && num <= neighbors.length) {
        event.preventDefault();
        window.location.assign(neighbors[num - 1].route);
      }
    }
  }

  onMount(() => {
    window.addEventListener('keydown', handleKeydown);
  });
  onDestroy(() => {
    window.removeEventListener('keydown', handleKeydown);
  });
</script>

<div
  class="absolute inset-0 flex items-center justify-center z-1300"
  style="background:rgba(10,22,30,0.62);"
  role="presentation"
  onclick={(e: MouseEvent) => { if (e.target === e.currentTarget && !showNext) showNext = false; }}
>
  <div
    class="rounded-[14px] p-7 text-center"
    style="background:var(--paper); color:var(--text-on-paper);
           width:min(380px,90vw); box-shadow:var(--shadow-deep);"
    role="dialog"
    aria-modal="true"
    aria-label="Typing complete"
  >
    {#if !showNext}
      <!-- Main completion view -->
      <div class="text-[0.68rem] tracking-[0.12em] uppercase"
           style="font-family:var(--font-mono); color:var(--text-muted-paper);">
        TYPING MODE
      </div>

      <h2 class="text-[1.6rem] mt-1 mb-1.5"
          style="font-family:var(--font-display); font-style:italic; font-weight:600;">
        Complete!
      </h2>

      <div class="text-[0.95rem] mb-5"
           style="font-family:var(--font-mono); color:var(--teal-deep); font-weight:600;">
        {total} / {total}
      </div>

      <div class="flex gap-2.5">
        <button
          type="button"
          class="flex-1 rounded-lg px-4.5 py-2.5 font-bold text-[0.88rem] border-none"
          style="background:var(--gold); color:var(--ink-deep);"
          onclick={onrestart}
          onmouseenter={(e: MouseEvent) =>
            (e.currentTarget as HTMLButtonElement).style.background = 'var(--gold-bright)'}
          onmouseleave={(e: MouseEvent) =>
            (e.currentTarget as HTMLButtonElement).style.background = 'var(--gold)'}
        >
          Restart <span class="kbd">R</span>
        </button>
        <button
          type="button"
          class="flex-1 rounded-lg px-3 py-2.25 font-semibold text-[0.82rem] border-[1.5px]"
          style="background:transparent; border-color:var(--ink-deep); color:var(--ink-deep);"
          onclick={() => { showNext = true; loadNeighbors(); }}
          onmouseenter={(e: MouseEvent) => {
            const el = e.currentTarget as HTMLButtonElement;
            el.style.background = 'var(--ink-deep)';
            el.style.color = 'var(--cream)';
          }}
          onmouseleave={(e: MouseEvent) => {
            const el = e.currentTarget as HTMLButtonElement;
            el.style.background = 'transparent';
            el.style.color = 'var(--ink-deep)';
          }}
        >
          Next → <span class="kbd">N</span>
        </button>
      </div>

    {:else}
      <!-- Neighbor selection view -->
      <div class="text-[0.68rem] tracking-[0.12em] uppercase mb-2"
           style="font-family:var(--font-mono); color:var(--text-muted-paper);">
        NEIGHBOURING COUNTRIES
      </div>

      {#if loadingNeighbors}
        <div class="py-4 text-[0.82rem]" style="color:var(--text-muted-paper);">
          Loading…
        </div>
      {:else if neighbors.length === 0}
        <div class="py-4">
          <div class="text-[0.88rem] mb-3" style="color:var(--text-muted-paper); font-family:var(--font-mono);">
            No neighbouring countries found
          </div>
          <button
            type="button"
            class="rounded-lg px-4 py-2 font-semibold text-[0.82rem] border-[1.5px]"
            style="background:transparent; border-color:var(--ink-deep); color:var(--ink-deep);"
            onclick={() => { showNext = false; }}
            onmouseenter={(e: MouseEvent) => {
              const el = e.currentTarget as HTMLButtonElement;
              el.style.background = 'var(--ink-deep)';
              el.style.color = 'var(--cream)';
            }}
            onmouseleave={(e: MouseEvent) => {
              const el = e.currentTarget as HTMLButtonElement;
              el.style.background = 'transparent';
              el.style.color = 'var(--ink-deep)';
            }}
          >
            ← Back <span class="kbd">Esc</span>
          </button>
        </div>
      {:else}
        <div class="flex flex-col gap-1.5 mb-4 max-h-[50vh] overflow-y-auto neighbor-list">
          {#each neighbors as neighbor, i}
            <button
              type="button"
              class="w-full flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-left border-[1.5px] neighbor-btn"
              style="background:transparent; border-color:var(--paper-line); color:var(--text-on-paper);"
              onclick={() => window.location.assign(neighbor.route)}
              onmouseenter={(e: MouseEvent) => {
                const el = e.currentTarget as HTMLButtonElement;
                el.style.background = 'rgba(203,155,62,0.15)';
                el.style.borderColor = 'var(--gold)';
              }}
              onmouseleave={(e: MouseEvent) => {
                const el = e.currentTarget as HTMLButtonElement;
                el.style.background = 'transparent';
                el.style.borderColor = 'var(--paper-line)';
              }}
            >
              <span class="num-badge">{i + 1}</span>
              <span class="text-[0.85rem] font-medium" style="font-family:var(--font-body);">
                {neighbor.name}
              </span>
            </button>
          {/each}
        </div>

        <button
          type="button"
          class="rounded-lg px-4 py-2 font-semibold text-[0.82rem] border-[1.5px]"
          style="background:transparent; border-color:var(--ink-deep); color:var(--ink-deep);"
          onclick={() => { showNext = false; }}
          onmouseenter={(e: MouseEvent) => {
            const el = e.currentTarget as HTMLButtonElement;
            el.style.background = 'var(--ink-deep)';
            el.style.color = 'var(--cream)';
          }}
          onmouseleave={(e: MouseEvent) => {
            const el = e.currentTarget as HTMLButtonElement;
            el.style.background = 'transparent';
            el.style.color = 'var(--ink-deep)';
          }}
        >
          ← Back <span class="kbd">Esc</span>
        </button>
      {/if}
    {/if}
  </div>
</div>

<style>
  .kbd {
    display:       inline-block;
    font-family:   var(--font-mono);
    font-size:     0.62rem;
    font-weight:   600;
    background:    rgba(0,0,0,0.10);
    color:         inherit;
    padding:       1px 5px;
    border-radius: 3px;
    margin-left:   4px;
    vertical-align: middle;
    line-height:   1.4;
  }

  .num-badge {
    display:       flex;
    align-items:   center;
    justify-content: center;
    width:         22px;
    height:        22px;
    border-radius: 5px;
    font-family:   var(--font-mono);
    font-size:     0.72rem;
    font-weight:   700;
    background:    var(--ink-deep);
    color:         var(--gold);
    flex-shrink:   0;
  }

  .neighbor-list {
    scrollbar-width: thin;
    scrollbar-color: var(--paper-line) transparent;
  }
</style>
