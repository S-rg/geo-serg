<script lang="ts">
  import { displayName } from '$lib/utils/helpers.js';

  interface Props {
    provinceName?: string;
    score?:        number;
    total?:        number;
    mistakes?:     number;
    bestStreak?:   number;
    onplayAgain?:  () => void;
    onclose?:      () => void;
  }

  let {
    provinceName = '—',
    score        = 0,
    total        = 0,
    mistakes     = 0,
    bestStreak   = 0,
    onplayAgain,
    onclose,
  }: Props = $props();

  interface StatRow { value: string | number; label: string; }

  const stats: StatRow[] = $derived([
    { value: `${score}/${total}`, label: 'Score' },
    { value: mistakes,            label: 'Mistakes' },
    { value: bestStreak,          label: 'Best streak' },
  ]);
</script>

<div
  class="absolute inset-0 flex items-center justify-center z-1300"
  style="background:rgba(10,22,30,0.62);"
  role="presentation"
  onclick={(e: MouseEvent) => { if (e.target === e.currentTarget) onclose?.(); }}
>
  <div
    class="rounded-[14px] p-7 text-center"
    style="background:var(--paper); color:var(--text-on-paper);
           width:min(360px,86vw); box-shadow:var(--shadow-deep);"
    role="dialog"
    aria-modal="true"
    aria-label="Quiz complete"
  >
    <div class="text-[0.68rem] tracking-[0.12em] uppercase"
         style="font-family:var(--font-mono); color:var(--text-muted-paper);">
      Complete!
    </div>

    <h2 class="text-[1.6rem] mt-1 mb-4"
        style="font-family:var(--font-display); font-style:italic; font-weight:600;">
      {displayName(provinceName)}
    </h2>

    <div class="flex justify-center gap-5.5 mb-5">
      {#each stats as stat}
        <div class="flex flex-col items-center">
          <span class="text-[1.3rem] font-bold" style="font-family:var(--font-mono);">
            {stat.value}
          </span>
          <span class="text-[0.62rem] tracking-[0.06em] uppercase mt-0.5"
                style="font-family:var(--font-mono); color:var(--text-muted-paper);">
            {stat.label}
          </span>
        </div>
      {/each}
    </div>

    <div class="flex gap-2.5">
      <button
        type="button"
        class="rounded-lg px-4.5 py-2.5 font-bold text-[0.88rem] border-none"
        style="background:var(--gold); color:var(--ink-deep);"
        onclick={onplayAgain}
        onmouseenter={(e: MouseEvent) =>
          (e.currentTarget as HTMLButtonElement).style.background = 'var(--gold-bright)'}
        onmouseleave={(e: MouseEvent) =>
          (e.currentTarget as HTMLButtonElement).style.background = 'var(--gold)'}
      >
        Play again
      </button>
      <button
        type="button"
        class="flex-1 rounded-lg px-3 py-2.25 font-semibold text-[0.82rem] border-[1.5px]"
        style="background:transparent; border-color:var(--ink-deep); color:var(--ink-deep);"
        onclick={onclose}
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
        Close
      </button>
    </div>
  </div>
</div>
