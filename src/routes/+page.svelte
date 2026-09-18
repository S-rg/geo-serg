<script lang="ts">
  import { onMount } from 'svelte';
  import StarfieldBackground from '$lib/components/StarfieldBackground.svelte';
  import CartoonGlobe from '$lib/components/CartoonGlobe.svelte';

  // ── DOM refs ───────────────────────────────────────────────────────────
  let scrollContainer = $state<HTMLDivElement | null>(null);
  let leftColEl       = $state<HTMLDivElement | null>(null);
  let rightColEl      = $state<HTMLDivElement | null>(null);

  // ── Reactive state ─────────────────────────────────────────────────────
  let scrollProgress = $state(0);   // 0 → 1 as user scrolls 100vh
  let leftCenterX    = $state(0);
  let rightCenterX   = $state(0);
  let globeCenterY   = $state(0);
  let isMobile       = $state(false);

  let toastMessage = $state<string | null>(null);
  let toastTimer: ReturnType<typeof setTimeout> | undefined;

  // ── Helpers ────────────────────────────────────────────────────────────
  function showToast(msg: string) {
    if (toastTimer) clearTimeout(toastTimer);
    toastMessage = msg;
    toastTimer = setTimeout(() => { toastMessage = null; }, 2400);
  }

  /**
   * Measure the center-X of each column and the vertical centre of the
   * right column (where the globe starts).  Called on mount + resize.
   */
  function updateGeometry() {
    if (!leftColEl || !rightColEl) return;
    const lRect = leftColEl.getBoundingClientRect();
    const rRect = rightColEl.getBoundingClientRect();

    isMobile     = window.innerWidth <= 960;
    leftCenterX  = lRect.left + lRect.width  / 2;
    rightCenterX = rRect.left + rRect.width  / 2;
    // Vertical centre: the right column's midpoint (constant while sticky)
    globeCenterY = rRect.top  + rRect.height / 2;
  }

  /**
   * Maps scroll progress from 0 → 1.
   * The track is 200vh, the container is 100vh, so max scrollTop = 100vh.
   * scrollHeight - clientHeight = 200vh - 100vh = 100vh = clientHeight.
   */
  function handleScroll() {
    if (!scrollContainer) return;
    const maxScroll = scrollContainer.scrollHeight - scrollContainer.clientHeight;
    if (maxScroll <= 0) return;
    scrollProgress = Math.min(Math.max(scrollContainer.scrollTop / maxScroll, 0), 1);
  }

  function scrollToScreen(index: number) {
    if (!scrollContainer) return;
    scrollContainer.scrollTo({
      top: index * scrollContainer.clientHeight,
      behavior: 'smooth'
    });
  }

  onMount(() => {
    updateGeometry();
    handleScroll();
    window.addEventListener('resize', updateGeometry);
    const t = setTimeout(updateGeometry, 150);
    return () => {
      window.removeEventListener('resize', updateGeometry);
      clearTimeout(t);
      if (toastTimer) clearTimeout(toastTimer);
    };
  });

  // ── Easing ────────────────────────────────────────────────────────────
  // Ease-in-out cubic makes the globe movement feel intentional & polished
  function easeInOut(t: number): number {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  }

  const easedProgress = $derived(easeInOut(scrollProgress));

  // ── Derived globe position ─────────────────────────────────────────────
  const smoothGlobeX = $derived(
    isMobile
      ? leftCenterX
      : rightCenterX + (leftCenterX - rightCenterX) * easedProgress
  );

  const globeY = $derived(
    isMobile
      ? (scrollProgress < 0.5 ? globeCenterY : globeCenterY - 130)
      : globeCenterY
  );
</script>

<svelte:head>
  <title>GEO SERG</title>
  <meta name="description" content="GEO SERG — Interactive Cartoon Globe" />
</svelte:head>

<!-- Cosmic starfield background -->
<StarfieldBackground />

<!--
  Architecture:
    .scroll-container  (100vh, overflow-y: scroll)
      .scroll-track    (200vh — provides scrollable distance)
        .sticky-stage  (100vh, position: sticky, top: 0)
                       — always fills viewport; globe animates inside it
-->
<div
  class="scroll-container"
  bind:this={scrollContainer}
  onscroll={handleScroll}
>
  <div class="scroll-track">
    <div class="sticky-stage">

      <!-- Two-column layout -->
      <div class="content-wrapper">

        <!-- LEFT: Brand text (screen 1) / Globe landing zone (screen 2) -->
        <div class="col col-left" bind:this={leftColEl}>
          <div
            class="hero-brand"
            style="
              opacity: {Math.max(0, 1 - scrollProgress * 2.2)};
              transform: translateX({-easedProgress * 60}px);
              pointer-events: {scrollProgress > 0.35 ? 'none' : 'auto'};
            "
          >
            <h1 class="brand-title">
              <span class="word-geo">GEO</span>
              <span class="word-serg">SERG</span>
            </h1>
          </div>
        </div>

        <!-- RIGHT: Globe origin (screen 1) / Menu (screen 2) -->
        <div class="col col-right" bind:this={rightColEl}>
          <div
            class="menu-card"
            style="
              opacity: {Math.max(0, (scrollProgress - 0.3) / 0.7)};
              transform: translateX({(1 - easedProgress) * 60}px);
              pointer-events: {scrollProgress > 0.65 ? 'auto' : 'none'};
            "
          >
            <div class="menu-header">
              <span class="menu-tag">MENU</span>
              <h2 class="menu-title">SELECT OPTION</h2>
            </div>

            <div class="menu-button-list">
              <a href="/fsm/world" class="option-btn btn-states">
                <span class="btn-indicator indicator-green"></span>
                <span class="btn-label">States</span>
                <span class="btn-arrow">→</span>
              </a>

              <button
                class="option-btn btn-cities"
                onclick={() => showToast('Cities mode coming soon!')}
              >
                <span class="btn-indicator indicator-blue"></span>
                <span class="btn-label">Cities</span>
                <span class="btn-arrow">→</span>
              </button>

              <button
                class="option-btn btn-hedge"
                onclick={() => showToast('Hedge Calculator coming soon!')}
              >
                <span class="btn-indicator indicator-gold"></span>
                <span class="btn-label">Hedge Calculator</span>
                <span class="btn-arrow">→</span>
              </button>

              <!-- Space for future options — no placeholder text/buttons -->
              <div class="menu-spacer" aria-hidden="true"></div>
            </div>
          </div>
        </div>

      </div><!-- /content-wrapper -->

      <!-- Globe: position-fixed, glides right → left via scroll -->
      <div
        class="globe-mover"
        style="left: {smoothGlobeX}px; top: {globeY}px;"
      >
        <CartoonGlobe size={540} />
      </div>

      <!-- Scroll hint -->
      {#if scrollProgress < 0.15}
        <button
          class="scroll-prompt prompt-down"
          onclick={() => scrollToScreen(1)}
          aria-label="Scroll to menu"
        >
          <span>SCROLL DOWN</span>
          <span class="arrow-bounce">↓</span>
        </button>
      {:else if scrollProgress > 0.88}
        <button
          class="scroll-prompt prompt-up"
          onclick={() => scrollToScreen(0)}
          aria-label="Scroll to top"
        >
          <span class="arrow-bounce-up">↑</span>
          <span>BACK TO TOP</span>
        </button>
      {/if}

      <!-- Toast -->
      {#if toastMessage}
        <div class="toast-popup" role="status">
          <span class="toast-icon">⚡</span>
          <span>{toastMessage}</span>
        </div>
      {/if}

    </div><!-- /sticky-stage -->
  </div><!-- /scroll-track -->
</div><!-- /scroll-container -->

<style>
  /* ── Scroll Container ──────────────────────────────────────────────── */
  .scroll-container {
    position: relative;
    z-index: 10;
    width: 100vw;
    height: 100vh;
    overflow-y: scroll;
    overflow-x: hidden;
    scroll-snap-type: y mandatory;
    user-select: none;
  }

  /* Subtle purple scrollbar */
  .scroll-container::-webkit-scrollbar        { width: 5px; }
  .scroll-container::-webkit-scrollbar-track  { background: transparent; }
  .scroll-container::-webkit-scrollbar-thumb  {
    background: rgba(138, 77, 255, 0.3);
    border-radius: 3px;
  }
  .scroll-container::-webkit-scrollbar-thumb:hover {
    background: rgba(138, 77, 255, 0.6);
  }

  /* ── 200vh Scroll Track ─────────────────────────────────────────────── */
  .scroll-track {
    position: relative;
    width: 100%;
    height: 200vh;
  }

  /*
    Scroll-snap targets: two snap points, one at the top and one at
    exactly 100vh into the track.
  */
  .scroll-track::before,
  .scroll-track::after {
    content: '';
    display: block;
    position: absolute;
    left: 0; width: 100%; height: 0;
    scroll-snap-align: start;
    scroll-snap-stop: always;
  }
  .scroll-track::before { top: 0; }
  .scroll-track::after  { top: 100vh; }

  /* ── Sticky Stage ───────────────────────────────────────────────────── */
  .sticky-stage {
    position: sticky;
    top: 0;
    height: 100vh;
    width: 100%;
    overflow: hidden;
    pointer-events: none;
  }

  /* ── Two-Column Content Layout ─────────────────────────────────────── */
  .content-wrapper {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 40px;
    max-width: 1400px;
    width: 90%;
    margin: 0 auto;
    height: 100%;
    padding: 20px;
    pointer-events: none;
  }

  .col {
    flex: 1;
    height: 100%;
    display: flex;
    align-items: center;
    pointer-events: none;
  }
  .col-left  { justify-content: flex-start; padding-left:  clamp(10px, 3vw, 60px); }
  .col-right { justify-content: center;     padding-right: clamp(10px, 2vw, 40px); }

  /* ── Brand Typography ─────────────────────────────────────────────── */
  .hero-brand { will-change: opacity, transform; }

  .brand-title {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    text-align: left;
    margin: 0;
    font-family: 'Rubik Mono One', var(--font-mono), 'Lucida Console', 'Courier New', monospace;
    font-size: clamp(5.5rem, 11vw, 10.5rem);
    font-weight: 900;
    line-height: 0.95;
    letter-spacing: -0.02em;
  }

  .word-geo  { color: #43d87d; display: block; }
  .word-serg { color: #38b6ff; display: block; }

  /* ── Menu Card ──────────────────────────────────────────────────────── */
  .menu-card {
    width: 100%;
    max-width: 480px;
    min-height: 480px;
    background: rgba(22, 12, 44, 0.88);
    border: 2px solid rgba(138, 77, 255, 0.35);
    border-radius: 24px;
    padding: 36px 32px 48px 32px;
    box-shadow: 0 20px 50px rgba(5, 2, 15, 0.7);
    backdrop-filter: blur(16px);
    display: flex;
    flex-direction: column;
    will-change: opacity, transform;
  }

  .menu-header   { margin-bottom: 28px; text-align: left; }

  .menu-tag {
    display: inline-block;
    font-family: 'Rubik Mono One', monospace;
    font-size: 0.72rem;
    font-weight: 900;
    color: #c4b5fd;
    background: rgba(138, 77, 255, 0.25);
    border: 1px solid rgba(138, 77, 255, 0.4);
    padding: 4px 10px;
    border-radius: 6px;
    letter-spacing: 0.08em;
    margin-bottom: 10px;
  }

  .menu-title {
    font-family: 'Rubik Mono One', monospace;
    font-size: 1.45rem;
    font-weight: 900;
    color: #ffffff;
    margin: 0;
    letter-spacing: -0.01em;
  }

  .menu-button-list { display: flex; flex-direction: column; gap: 16px; flex: 1; }

  /* ── Option Buttons ─────────────────────────────────────────────────── */
  .option-btn {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: 16px 22px;
    background: rgba(35, 20, 68, 0.75);
    border: 2px solid rgba(138, 77, 255, 0.3);
    border-radius: 16px;
    color: #ffffff;
    text-decoration: none;
    cursor: pointer;
    font-family: 'Space Grotesk', system-ui, sans-serif;
    font-weight: 700;
    font-size: 1.15rem;
    letter-spacing: 0.02em;
    transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
    box-shadow: 0 4px 0 rgba(15, 8, 30, 0.9);
  }

  .btn-indicator {
    width: 12px; height: 12px;
    border-radius: 4px;
    margin-right: 14px;
    flex-shrink: 0;
  }
  .indicator-green { background: #43d87d; box-shadow: 0 0 10px rgba(67, 216, 125, 0.6); }
  .indicator-blue  { background: #38b6ff; box-shadow: 0 0 10px rgba(56, 182, 255, 0.6); }
  .indicator-gold  { background: #ffbe38; box-shadow: 0 0 10px rgba(255, 190, 56, 0.6); }

  .btn-label { flex: 1; text-align: left; }
  .btn-arrow {
    font-size: 1.25rem; color: #a79fc7;
    transition: transform 0.2s ease, color 0.2s ease;
  }

  .btn-states:hover {
    border-color: #43d87d; background: rgba(67, 216, 125, 0.12);
    transform: translateY(-2px);
    box-shadow: 0 6px 0 rgba(20, 80, 45, 0.8), 0 10px 20px rgba(67, 216, 125, 0.2);
  }
  .btn-states:hover .btn-arrow { color: #43d87d; transform: translateX(4px); }

  .btn-cities:hover {
    border-color: #38b6ff; background: rgba(56, 182, 255, 0.12);
    transform: translateY(-2px);
    box-shadow: 0 6px 0 rgba(20, 60, 110, 0.8), 0 10px 20px rgba(56, 182, 255, 0.2);
  }
  .btn-cities:hover .btn-arrow { color: #38b6ff; transform: translateX(4px); }

  .btn-hedge:hover {
    border-color: #ffbe38; background: rgba(255, 190, 56, 0.12);
    transform: translateY(-2px);
    box-shadow: 0 6px 0 rgba(110, 80, 15, 0.8), 0 10px 20px rgba(255, 190, 56, 0.2);
  }
  .btn-hedge:hover .btn-arrow { color: #ffbe38; transform: translateX(4px); }

  .option-btn:active {
    transform: translateY(2px);
    box-shadow: 0 2px 0 rgba(15, 8, 30, 0.9);
  }

  /* Generous space below buttons — no placeholder content */
  .menu-spacer { flex: 1; min-height: 120px; }

  /* ── Globe Mover ────────────────────────────────────────────────────── */
  .globe-mover {
    position: fixed;
    z-index: 20;
    transform: translate(-50%, -50%);
    pointer-events: auto;
    will-change: left, top;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /* ── Scroll Prompts ─────────────────────────────────────────────────── */
  .scroll-prompt {
    position: fixed;
    bottom: 28px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(26, 14, 52, 0.85);
    border: 1px solid rgba(138, 77, 255, 0.4);
    color: #d6ccff;
    padding: 8px 20px;
    border-radius: 9999px;
    font-family: var(--font-mono), monospace;
    font-size: 0.76rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    cursor: pointer;
    pointer-events: auto;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    backdrop-filter: blur(8px);
    box-shadow: 0 8px 24px rgba(6, 2, 16, 0.5);
    transition: background 0.2s ease, border-color 0.2s ease, color 0.2s ease, transform 0.2s ease;
    z-index: 40;
  }
  .scroll-prompt:hover {
    background: rgba(138, 77, 255, 0.25);
    border-color: #43d87d;
    color: #ffffff;
    transform: translateX(-50%) translateY(-2px);
  }

  .arrow-bounce    { animation: bounceDown 1.8s infinite ease-in-out; }
  .arrow-bounce-up { animation: bounceUp   1.8s infinite ease-in-out; }

  @keyframes bounceDown {
    0%, 100% { transform: translateY(0);   }
    50%      { transform: translateY(4px); }
  }
  @keyframes bounceUp {
    0%, 100% { transform: translateY(0);    }
    50%      { transform: translateY(-4px); }
  }

  /* ── Toast ──────────────────────────────────────────────────────────── */
  .toast-popup {
    position: fixed;
    top: 28px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(28, 14, 58, 0.95);
    border: 1.5px solid #38b6ff;
    color: #ffffff;
    padding: 10px 24px;
    border-radius: 12px;
    font-family: 'Space Grotesk', system-ui, sans-serif;
    font-weight: 700;
    font-size: 0.92rem;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6), 0 0 20px rgba(56, 182, 255, 0.25);
    display: flex;
    align-items: center;
    gap: 10px;
    z-index: 100;
    pointer-events: none;
    animation: toastPop 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
  .toast-icon { font-size: 1.1rem; color: #ffbe38; }

  @keyframes toastPop {
    from { opacity: 0; transform: translate(-50%, -10px) scale(0.9); }
    to   { opacity: 1; transform: translate(-50%, 0)     scale(1);   }
  }

  /* ── Responsive ─────────────────────────────────────────────────────── */
  @media (max-width: 960px) {
    .content-wrapper {
      flex-direction: column;
      justify-content: center;
      gap: 20px;
    }
    .col {
      width: 100%;
      justify-content: center !important;
      padding: 0 !important;
    }
    .brand-title {
      font-size: clamp(3.8rem, 14vw, 6rem);
      align-items: center;
      text-align: center;
    }
    .menu-card {
      max-width: 92%;
      min-height: 400px;
      padding: 24px 20px;
    }
  }
</style>
