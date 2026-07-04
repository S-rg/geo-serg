<script lang="ts">
  import type { SubdivisionItem, SidebarHoverPayload } from '$lib/types.js';

  interface Props {
    items?:    SubdivisionItem[];
    onselect?: (id: string) => void;
    onhover?:  (payload: SidebarHoverPayload) => void;
  }

  let { items = [], onselect, onhover }: Props = $props();

  let searchQuery = $state('');

  let filtered = $derived(
    searchQuery.trim()
      ? items.filter(it =>
          it.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
        )
      : items
  );
</script>

<div class="flex flex-col min-h-0 h-full">
  <div class="px-4 pt-4 pb-2.5 shrink-0">
    <div class="text-[0.68rem] tracking-widest uppercase"
         style="font-family:var(--font-mono); color:var(--text-muted-paper);">
      SUBDIVISION
    </div>
    <div class="text-[0.72rem] mt-0.5"
         style="font-family:var(--font-mono); color:var(--text-muted-paper);">
      {items.length} areas
    </div>
    <input
      type="text"
      bind:value={searchQuery}
      placeholder="Filter by name…"
      class="w-full mt-2.5 px-2.5 py-2 rounded-[7px] text-[0.85rem] border"
      style="border-color:rgba(30,44,51,0.18); background:rgba(255,255,255,0.55);
             font-family:var(--font-body); color:var(--text-on-paper);"
    />
  </div>

  <ul class="m-0 py-1 pb-3 overflow-y-auto flex-1" style="list-style:none; padding-left:0;">
    {#each filtered as item (item.id)}
      <li>
        <!-- svelte-ignore a11y_mouse_events_have_key_events -->
        <button
          type="button"
          class="kab-item block w-full text-left border-none px-4 py-2.25 text-[0.88rem]"
          style="background:transparent; color:var(--text-on-paper); border-bottom:1px solid var(--paper-line);"
          data-id={item.id}
          onclick={() => onselect?.(item.id)}
          onmouseenter={() => onhover?.({ id: item.id, entering: true })}
          onmouseleave={() => onhover?.({ id: item.id, entering: false })}
        >
          {item.name}
        </button>
      </li>
    {/each}
  </ul>
</div>

<style>
  :global(.kab-item:hover),
  :global(.kab-item:focus-visible) {
    background: rgba(203,155,62,0.22) !important;
    outline: none;
  }
  :global(.kab-item.flash) {
    background: var(--gold) !important;
    color: var(--ink-deep) !important;
    font-weight: 600;
  }
</style>
