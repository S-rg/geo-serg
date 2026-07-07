<script lang="ts">
  import type { SubdivisionItem } from '$lib/types.js';

  interface Props {
    items?:        SubdivisionItem[];
    completedIds?: Set<string>;
    onmatch?:      (item: SubdivisionItem) => void;
    onrestart?:    () => void;
  }

  let {
    items        = [],
    completedIds = new Set<string>(),
    onmatch,
    onrestart,
  }: Props = $props();

  let inputEl   = $state<HTMLInputElement | null>(null);
  let typedText = $state('');

  let total     = $derived(items.length);
  let foundCount = $derived(completedIds.size);
  let pct       = $derived(total > 0 ? Math.round((foundCount / total) * 100) : 0);
  let allFound  = $derived(total > 0 && foundCount === total);

  const province_name_replacements = {
    'michoacan de ocampo': 'michoacan',
    'veracruz de ignacio de la llave': 'veracruz',
    'coahuila de zaragoza': 'coahuila',
    'queretaro de arteaga': 'queretaro',
    'district of columbia': 'washington dc',
    'commonwealth of the northern mariana islands': 'northern mariana islands',
  }

  function normalize(s: string): string {
    return s
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ');
  }

  function variantsFor(name: string): string[] {
    const norm = normalize(name);
    let stripped = norm.replace(/^(kabupaten|kota|kab\.?)\s+/, '');
    stripped = stripped.replace(/^departamento de\s+/i, '');

    if (stripped in province_name_replacements) {
      stripped = province_name_replacements[stripped];
    }

    return stripped !== norm ? [norm, stripped] : [norm];
  }

  function handleInput(): void {
    const typedNorm = normalize(typedText);
    if (!typedNorm) return;

    const match = items.find(
      it => !completedIds.has(it.id) && variantsFor(it.name).includes(typedNorm)
    );

    if (match) {
      onmatch?.(match);
      typedText = '';
    }
  }

  export function focusInput(): void {
    inputEl?.focus();
  }
</script>

<div class="flex flex-col min-h-0 h-full">
  <div class="px-4 pt-4 pb-2.5 shrink-0">
    <div class="text-[0.68rem] tracking-widest uppercase"
         style="font-family:var(--font-mono); color:var(--text-muted-paper);">
      TYPING MODE
    </div>
    <div class="text-[0.72rem] mt-0.5"
         style="font-family:var(--font-mono); color:var(--text-muted-paper);">
      {foundCount} / {total} found
    </div>

    <!-- Progress bar -->
    <div
      class="w-full mt-2.5 rounded-full overflow-hidden"
      style="height:8px; background:var(--paper-line);"
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Provinces typed"
    >
      <div
        class="h-full rounded-full"
        style="width:{pct}%; background:var(--gold);
               transition:width 0.35s ease;"
      ></div>
    </div>

    <input
      bind:this={inputEl}
      type="text"
      bind:value={typedText}
      oninput={handleInput}
      autocomplete="off"
      autocorrect="off"
      autocapitalize="off"
      spellcheck="false"
      disabled={allFound}
      placeholder={allFound ? 'All done!' : 'Type a name…'}
      class="w-full mt-2.5 px-2.5 py-2 rounded-[7px] text-[0.85rem] border"
      style="border-color:rgba(30,44,51,0.18); background:rgba(255,255,255,0.55);
             font-family:var(--font-body); color:var(--text-on-paper);"
    />
  </div>

  {#if allFound}
    <div class="px-4 pt-3 pb-3 shrink-0 text-center">
      <div class="text-[0.85rem] font-semibold mb-2.5" style="color:var(--ink-deep);">
      Complete!
      </div>
      <button
        type="button"
        class="w-full rounded-lg px-3 py-2.25 font-semibold text-[0.82rem] border-[1.5px]"
        style="background:transparent; border-color:var(--ink-deep); color:var(--ink-deep);"
        onclick={onrestart}
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
        Restart
      </button>
    </div>
  {/if}
</div>