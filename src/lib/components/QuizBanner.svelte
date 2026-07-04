<script lang="ts">
  import type { FeedbackClass } from '$lib/types.js';

  interface Props {
    targetName?:    string;
    feedbackText?:  string;
    feedbackClass?: FeedbackClass;
    onskip?:        () => void;
  }

  let {
    targetName    = '—',
    feedbackText  = '',
    feedbackClass = '',
    onskip,
  }: Props = $props();

  const FEEDBACK_COLORS: Record<FeedbackClass, string> = {
    correct: 'var(--teal)',
    wrong:   'var(--rust)',
    skip:    'var(--gold-bright)',
    '':      'transparent',
  };

  let feedbackColor = $derived(FEEDBACK_COLORS[feedbackClass] ?? 'transparent');
</script>

<div
  class="absolute top-4.5 left-1/2 -translate-x-1/2 z-1200 rounded-[14px] px-6.5 pt-3.5 pb-3 text-center quiz-banner"
  style="background:var(--ink-surface); border:1px solid var(--border-hair); box-shadow:var(--shadow-deep); min-width:260px;"
>
  <div class="text-[0.66rem] tracking-[0.12em] uppercase"
       style="font-family:var(--font-mono); color:var(--text-muted-dark);">
    Find on the map
  </div>

  <div class="mt-0.5 font-semibold"
       style="font-family:var(--font-display); font-size:clamp(1.4rem,3.4vw,2rem); color:var(--cream);">
    {targetName}
  </div>

  <div
    class="text-[0.82rem] font-semibold h-[1.3em] mt-1.5 transition-opacity duration-150"
    style="color:{feedbackColor};"
  >
    {feedbackText}
  </div>

  <button
    type="button"
    class="border-none text-[0.76rem] underline mt-1 p-0.5"
    style="background:none; color:var(--text-muted-dark);"
    onclick={onskip}
    onmouseenter={(e: MouseEvent) =>
      (e.currentTarget as HTMLButtonElement).style.color = 'var(--gold-bright)'}
    onmouseleave={(e: MouseEvent) =>
      (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted-dark)'}
  >
    Skip this one →
  </button>
</div>

<style>
  @media (max-width: 760px) {
    .quiz-banner { min-width: 200px !important; padding: 10px 16px 8px !important; }
  }
</style>
