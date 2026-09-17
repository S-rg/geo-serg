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
  class="absolute top-4 right-4 sm:top-5 sm:right-5 z-[1200] rounded-2xl p-4 text-left quiz-banner shadow-2xl flex flex-col justify-center"
  style="background: rgba(28, 60, 78, 0.85); backdrop-filter: blur(12px); border: 1px solid rgba(243, 238, 221, 0.15); min-width: 220px; max-width: 320px;"
>
  <div class="flex items-center gap-1.5 mb-1 opacity-90">
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="10" r="3"/>
      <path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 7 8 11.7z"/>
    </svg>
    <div
      class="text-[0.68rem] tracking-[0.15em] uppercase select-none font-medium mt-[1px]"
      style="font-family:var(--font-mono); color:var(--gold);"
    >
      Find on map
    </div>
  </div>

  <div
    class="font-bold leading-tight break-words"
    style="font-family:var(--font-display); font-size:1.35rem; color:var(--cream);"
  >
    {targetName}
  </div>

  <div class="flex items-end justify-between mt-3 h-[24px]">
    <div
      class="text-[0.8rem] font-semibold transition-opacity duration-150 truncate flex-1"
      style="color:{feedbackColor}; padding-bottom: 2px;"
    >
      {feedbackText}
    </div>

    <button
      type="button"
      class="border-none text-[0.75rem] font-medium px-3 py-1.5 rounded-full cursor-pointer transition-all shrink-0 flex items-center gap-1 ml-3"
      style="background: rgba(255,255,255,0.06); color:var(--cream); box-shadow: 0 2px 4px rgba(0,0,0,0.1);"
      onclick={onskip}
      onmouseenter={(e: MouseEvent) => {
        (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.12)';
        (e.currentTarget as HTMLButtonElement).style.color = 'var(--gold-bright)';
      }}
      onmouseleave={(e: MouseEvent) => {
        (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)';
        (e.currentTarget as HTMLButtonElement).style.color = 'var(--cream)';
      }}
    >
      Skip
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="mt-[1px]"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
    </button>
  </div>
</div>

<style>
  @media (max-width: 760px) {
    .quiz-banner {
      top: 0.75rem !important;
      right: 0.75rem !important;
      left: auto !important;
      min-width: 200px !important;
      max-width: 260px !important;
      padding: 14px 16px !important;
    }
  }
</style>
