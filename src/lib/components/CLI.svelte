<script lang="ts">
  import { onMount } from 'svelte';
  import { fade, fly } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  import { REDUCED_MOTION } from '$lib/utils/helpers.js';

  let {
    oncommand,
  }: {
    oncommand?: (raw: string) => void;
  } = $props();

  let open    = $state(false);
  let value   = $state('');
  let inputEl = $state<HTMLInputElement | null>(null);

  function isTypingInField(target: EventTarget | null): boolean {
    const element = target as HTMLElement | null;
    return Boolean(
      element?.closest('input, textarea, select, [contenteditable="true"]')
    );
  }

  function openPalette(): void {
    open = true;
    value = '';
    // wait for the input to exist in the DOM before focusing it
    queueMicrotask(() => inputEl?.focus());
  }

  function closePalette(): void {
    open = false;
    value = '';
  }

  function handleGlobalKeydown(event: KeyboardEvent): void {
    if (open) return;
    if (event.key !== ':') return;
    if (isTypingInField(event.target)) return;

    event.preventDefault();
    openPalette();
  }

  function handlePaletteKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      closePalette();
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      const raw = value.trim();
      if (raw) oncommand?.(raw);
      closePalette();
    }
  }

  onMount(() => {
    window.addEventListener('keydown', handleGlobalKeydown);
    return () => window.removeEventListener('keydown', handleGlobalKeydown);
  });
</script>

{#if open}
  <div
    class="cli-backdrop"
    role="button"
    tabindex="-1"
    aria-label="Close command palette"
    transition:fade={{ duration: REDUCED_MOTION ? 0 : 140 }}
    onclick={closePalette}
    onkeydown={(e) => { if (e.key === 'Escape') closePalette(); }}
  >
    <div
      class="cli-panel"
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
      tabindex="-1"
      transition:fly={{ y: REDUCED_MOTION ? 0 : -14, duration: REDUCED_MOTION ? 0 : 200, easing: quintOut }}
      onclick={(e) => e.stopPropagation()}
      onkeydown={(e) => e.stopPropagation()}
    >
      <span class="cli-caret">:</span>
      <input
        bind:this={inputEl}
        bind:value
        type="text"
        class="cli-input"
        placeholder="type a command…"
        autocomplete="off"
        autocapitalize="off"
        spellcheck="false"
        onkeydown={handlePaletteKeydown}
      />
      <span class="cli-hint">ESC</span>
    </div>
  </div>
{/if}

<style>
  .cli-backdrop {
    position: fixed;
    inset: 0;
    z-index: 200;
    background: rgba(10, 10, 12, 0.55);
    backdrop-filter: blur(2px);
    display: flex;
    justify-content: center;
    padding-top: 16vh;
  }

  .cli-panel {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    width: min(560px, 88vw);
    height: fit-content;
    padding: 0.7rem 0.9rem;
    background: var(--ink-deep);
    border: 1px solid rgba(203, 155, 62, 0.35);
    border-radius: 8px;
    box-shadow:
      0 12px 32px rgba(0, 0, 0, 0.45),
      0 0 0 1px rgba(0, 0, 0, 0.2);
  }

  .cli-caret {
    font-family: var(--font-mono);
    font-size: 1.05rem;
    font-weight: 700;
    color: var(--gold);
    line-height: 1;
    animation: cli-pulse 1.1s ease-in-out infinite;
  }

  .cli-input {
    flex: 1;
    min-width: 0;
    background: transparent;
    border: none;
    outline: none;
    font-family: var(--font-mono);
    font-size: 0.95rem;
    color: var(--cream);
    caret-color: var(--gold);
  }

  .cli-input::placeholder {
    color: var(--text-muted-dark);
  }

  .cli-hint {
    flex-shrink: 0;
    font-family: var(--font-mono);
    font-size: 0.68rem;
    letter-spacing: 0.03em;
    color: var(--text-muted-dark);
    border: 1px solid rgba(255, 255, 255, 0.14);
    border-radius: 4px;
    padding: 0.1rem 0.4rem;
  }

  @keyframes cli-pulse {
    0%, 100% { opacity: 1; }
    50%      { opacity: 0.35; }
  }

  :global(.reduced-motion) .cli-caret {
    animation: none;
  }
</style>