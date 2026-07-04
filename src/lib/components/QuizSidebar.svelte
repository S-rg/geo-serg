<script lang="ts">
  interface StatRow {
    label: string;
    value: string | number;
    rust:  boolean;
  }

  interface Props {
    score?:      number;
    mistakes?:   number;
    skipped?:    number;
    streak?:     number;
    bestStreak?: number;
    total?:      number;
    onrestart?:  () => void;
  }

  let {
    score      = 0,
    mistakes   = 0,
    skipped    = 0,
    streak     = 0,
    bestStreak = 0,
    total      = 0,
    onrestart,
  }: Props = $props();

  let stats: StatRow[] = $derived([
    { label: 'Score',       value: `${score} / ${total}`, rust: false },
    { label: 'Streak',      value: streak,                rust: false },
    { label: 'Best streak', value: bestStreak,            rust: false },
    { label: 'Mistakes',    value: mistakes,              rust: true  },
    { label: 'Skipped',     value: skipped,               rust: false },
  ]);
</script>

<div class="flex flex-col min-h-0 h-full">
  <div class="px-4 pt-4 pb-2.5 shrink-0">
    <div class="text-[0.68rem] tracking-widest uppercase"
         style="font-family:var(--font-mono); color:var(--text-muted-paper);">
      Quiz Progress
    </div>
  </div>

  <div class="px-4 pt-1 pb-2 flex flex-col gap-3">
    {#each stats as stat}
      <div class="flex justify-between items-baseline pb-2"
           style="border-bottom:1px solid var(--paper-line);">
        <span class="text-[0.7rem] tracking-[0.08em] uppercase"
              style="font-family:var(--font-mono); color:var(--text-muted-paper);">
          {stat.label}
        </span>
        <span class="text-[1.15rem] font-semibold"
              style="font-family:var(--font-mono); color:{stat.rust ? 'var(--rust)' : 'var(--ink-deep)'};">
          {stat.value}
        </span>
      </div>
    {/each}
  </div>

  <div class="mt-auto px-4 pt-3 pb-4 shrink-0">
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
      Restart this province
    </button>
  </div>
</div>
