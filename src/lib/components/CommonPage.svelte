<script lang="ts">
  import { get } from 'svelte/store';
  import { browser } from '$app/environment';

  import TopBar          from '$lib/components/TopBar.svelte';
  import MapView         from '$lib/components/MapView.svelte';
  import ExploreSidebar  from '$lib/components/ExploreSidebar.svelte';
  import QuizSidebar     from '$lib/components/QuizSidebar.svelte';
  import TypingSidebar   from '$lib/components/TypingSidebar.svelte';
  import QuizBanner      from '$lib/components/QuizBanner.svelte';
  import CompletionModal from '$lib/components/CompletionModal.svelte';

  import { STYLE }                                from '$lib/utils/mapStyles.js';
  import { shuffle, displayName, REDUCED_MOTION } from '$lib/utils/helpers.js';
  import {
    mode, province, layersById, completedIds,
    score, mistakes, skipped, streak, bestStreak,
    quizQueue, currentTarget, wrongThisRound,
    feedbackText, feedbackClass, showModal,
  } from '$lib/stores/appState.js';

  import type {
    AppMode, ClickPayload, FeedbackClass, HoverPayload,
    SubdivisionItem, SubdivisionLayer, LayersById, ProvincesData,
  } from '$lib/types.js';

  let { data }: { data: { provinces?: any; loadError?: string } } = $props();

  let mapView          = $state<ReturnType<typeof MapView> | null>(null);
  let exploreItems     = $state<SubdivisionItem[]>([]);
  let feedbackTimer    = $state<ReturnType<typeof setTimeout> | null>(null);

  let PROVINCES     = $derived<ProvincesData>(data.provinces ?? {});
  let provinceNames = $derived<string[]>(
    Object.keys(PROVINCES).sort((a, b) => displayName(a).localeCompare(displayName(b)))
  );

  let modeVal           = $state<AppMode>('explore');
  let layersByIdVal     = $state<LayersById>({});
  let completedIdsVal   = $state<Set<string>>(new Set());
  let scoreVal          = $state<number>(0);
  let mistakesVal       = $state<number>(0);
  let skippedVal        = $state<number>(0);
  let streakVal         = $state<number>(0);
  let bestStreakVal      = $state<number>(0);
  let currentTargetVal  = $state<SubdivisionItem | null>(null);
  let wrongThisRoundVal = $state<boolean>(false);
  let feedbackTextVal   = $state<string>('');
  let feedbackClassVal  = $state<FeedbackClass>('');
  let showModalVal      = $state<boolean>(false);
  let provinceVal       = $state<string | null>(null);
  let selectedProvince  = $state<string>('');

  mode.subscribe(v => (modeVal = v));
  layersById.subscribe(v => { layersByIdVal = v; rebuildExploreItems(v); });
  completedIds.subscribe(v => (completedIdsVal = v));
  score.subscribe(v => (scoreVal = v));
  mistakes.subscribe(v => (mistakesVal = v));
  skipped.subscribe(v => (skippedVal = v));
  streak.subscribe(v => (streakVal = v));
  bestStreak.subscribe(v => (bestStreakVal = v));
  currentTarget.subscribe(v => (currentTargetVal = v));
  wrongThisRound.subscribe(v => (wrongThisRoundVal = v));
  feedbackText.subscribe(v => (feedbackTextVal = v));
  feedbackClass.subscribe(v => (feedbackClassVal = v));
  showModal.subscribe(v => (showModalVal = v));
  province.subscribe(v => (provinceVal = v));

  let layerTotal = $derived(Object.keys(layersByIdVal).length);

  $effect(() => {
    if (browser && REDUCED_MOTION) document.body.classList.add('reduced-motion');
  });

  $effect(() => {
    if (provinceNames.length > 0 && !selectedProvince) {
      selectedProvince = PROVINCES['Bali'] ? 'Bali' : provinceNames[0];
    }
  });

  function onMapReady(): void {
    if (selectedProvince) loadProvince(selectedProvince);
  }

  function loadProvince(name: string): void {
    province.set(name);
    selectedProvince = name;
    completedIds.set(new Set());
    mapView!.loadGeoJSON(PROVINCES[name]);
    mapView!.applyModeStyles();
    if (modeVal === 'quiz') startQuizSession();
    if (modeVal === 'typing') startTypingSession();
  }

  function rebuildExploreItems(layers: LayersById): void {
    exploreItems = Object.values(layers)
      .map(l => ({ id: l.feature.properties.id, name: l.feature.properties.name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  function switchMode(newMode: AppMode): void {
    if (newMode === modeVal) return;
    mode.set(newMode);
    mapView?.applyModeStyles();
    if (newMode === 'quiz') startQuizSession();
    if (newMode === 'typing') startTypingSession();
  }

  function selectSubdivision(id: string, doFly: boolean): void {
    const layer = layersByIdVal[id];
    if (!layer) return;
    if (doFly) mapView!.flyToLayer(layer);
    mapView!.ripple(layer.getBounds().getCenter(), 'gold');
    layer.setStyle(STYLE.explorePulse);
    setTimeout(() => {
      if (modeVal === 'explore') layer.setStyle(STYLE.exploreDefault);
    }, 1200);
    flashListItem(id);
  }

  function flashListItem(id: string): void {
    const btn = document.querySelector<HTMLButtonElement>(
      `.kab-item[data-id="${CSS.escape(id)}"]`
    );
    if (!btn) return;
    btn.classList.add('flash');
    btn.scrollIntoView({ block: 'nearest', behavior: REDUCED_MOTION ? 'auto' : 'smooth' });
    setTimeout(() => btn.classList.remove('flash'), 1200);
  }

  function onMapHover({ feature, layer, entering }: HoverPayload): void {
    const id = feature.properties.id;
    if (modeVal === 'explore') {
      layer.setStyle(entering ? STYLE.exploreHover : STYLE.exploreDefault);
      highlightListItem(id, entering);
    } else {
      if (completedIdsVal.has(id)) return;
      layer.setStyle(entering ? STYLE.quizHover : STYLE.quizDefault);
    }
  }

  function highlightListItem(id: string, on: boolean): void {
    const btn = document.querySelector<HTMLButtonElement>(
      `.kab-item[data-id="${CSS.escape(id)}"]`
    );
    if (btn) btn.style.background = on ? 'rgba(203,155,62,0.22)' : '';
  }

  function onMapClick({ feature, layer }: ClickPayload): void {
    if (modeVal === 'explore') {
      selectSubdivision(feature.properties.id, true);
    } else {
      if (!currentTargetVal || completedIdsVal.has(feature.properties.id)) return;
      if (feature.properties.id === currentTargetVal.id) handleCorrect(layer, feature);
      else handleWrong(layer);
    }
  }

  function startTypingSession(): void {
    completedIds.set(new Set());
    mapView?.applyModeStyles();
  }

  function handleTypingMatch(item: SubdivisionItem): void {
    if (completedIdsVal.has(item.id)) return;
    const layer = layersByIdVal[item.id];
    completedIds.update(s => new Set(s).add(item.id));
    if (layer) {
      layer.setStyle(STYLE.completed);
      // mapView!.ripple(layer.getBounds().getCenter(), 'teal');
    }
  }

  function startQuizSession(): void {
    completedIds.set(new Set());
    mapView?.applyModeStyles();
    const items: SubdivisionItem[] = Object.values(layersByIdVal).map(l => ({
      id:   l.feature.properties.id,
      name: l.feature.properties.name,
    }));
    quizQueue.set(shuffle(items));
    score.set(0); mistakes.set(0); skipped.set(0);
    streak.set(0); bestStreak.set(0); wrongThisRound.set(false);
    showModal.set(false);
    nextTarget();
  }

  function nextTarget(): void {
    if (feedbackTimer) clearTimeout(feedbackTimer);
    const q = get(quizQueue);
    if (q.length === 0) {
      currentTarget.set(null);
      feedbackText.set('');
      feedbackClass.set('');
      showModal.set(true);
      return;
    }
    const [next, ...rest] = q;
    quizQueue.set(rest);
    currentTarget.set(next);
    wrongThisRound.set(false);
    feedbackText.set('');
    feedbackClass.set('');
  }

  function handleCorrect(layer: SubdivisionLayer, feature: SubdivisionLayer['feature']): void {
    const id = feature.properties.id;
    completedIds.update(s => new Set(s).add(id));
    score.update(n => n + 1);
    if (!wrongThisRoundVal) {
      streak.update(n => {
        const next = n + 1;
        bestStreak.update(b => Math.max(b, next));
        return next;
      });
    } else {
      streak.set(0);
    }
    layer.setStyle(STYLE.completed);
    mapView!.ripple(layer.getBounds().getCenter(), 'teal');
    feedbackText.set('Correct — ' + feature.properties.name);
    feedbackClass.set('correct');
    feedbackTimer = setTimeout(nextTarget, REDUCED_MOTION ? 150 : 850);
  }

  function handleWrong(layer: SubdivisionLayer): void {
    mistakes.update(n => n + 1);
    wrongThisRound.set(true);
    streak.set(0);
    const id = layer.feature.properties.id;
    layer.setStyle(STYLE.quizWrong);
    mapView!.ripple(layer.getBounds().getCenter(), 'rust');
    feedbackText.set('Not quite — try again');
    feedbackClass.set('wrong');
    setTimeout(() => {
      if (!completedIdsVal.has(id)) layer.setStyle(STYLE.quizDefault);
    }, REDUCED_MOTION ? 50 : 500);
  }

  function handleSkip(): void {
    if (!currentTargetVal) return;
    skipped.update(n => n + 1);
    streak.set(0);
    const target = currentTargetVal;
    const layer  = layersByIdVal[target.id];
    if (layer) {
      layer.setStyle(STYLE.quizReveal);
      mapView!.ripple(layer.getBounds().getCenter(), 'gold');
      mapView!.flyToLayer(layer);
    }
    feedbackText.set('This was ' + target.name);
    feedbackClass.set('skip');
    completedIds.update(s => new Set(s).add(target.id));
    feedbackTimer = setTimeout(() => {
      if (layer) layer.setStyle(STYLE.completed);
      nextTarget();
    }, REDUCED_MOTION ? 150 : 1200);
  }
</script>

<svelte:head>
  <title>GEOSERG | FINITE STATE MACHINE</title>
</svelte:head>

<div class="h-screen flex flex-col">

  {#if data.loadError}
    <div class="flex items-center justify-center h-full flex-col gap-4 p-8 text-center"
         style="background:var(--ink-deep);">
      <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="var(--rust)" stroke-width="1.5">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      <p class="text-[1rem] font-semibold" style="color:var(--cream);">{data.loadError}</p>
      <p class="text-[0.82rem]" style="color:var(--text-muted-dark); font-family:var(--font-mono);">
        Place <code style="color:var(--gold);">data.json</code> into the
        <code style="color:var(--gold);">static/</code> folder, then reload.
      </p>
    </div>

  {:else}

    <TopBar
      {provinceNames}
      {selectedProvince}
      activeMode={modeVal}
      onprovinceChange={loadProvince}
      onmodeChange={switchMode}
    />

    <div class="flex flex-1 min-h-0 layout-body">

      <aside
        class="w-75 shrink-0 flex flex-col min-h-0 sidebar"
        style="background:var(--paper); color:var(--text-on-paper); border-right:1px solid rgba(0,0,0,0.12);"
      >
        {#if modeVal === 'explore'}
          <ExploreSidebar
            items={exploreItems}
            onselect={(id: string) => selectSubdivision(id, true)}
            onhover={({ id, entering }) => {
              const layer = layersByIdVal[id];
              if (layer) layer.setStyle(entering ? STYLE.exploreHover : STYLE.exploreDefault);
            }}
          />
        {:else if modeVal === 'typing'}
          <TypingSidebar
            items={exploreItems}
            completedIds={completedIdsVal}
            onmatch={handleTypingMatch}
            onrestart={startTypingSession}
          />
        {:else}
          <QuizSidebar
            score={scoreVal}
            mistakes={mistakesVal}
            skipped={skippedVal}
            streak={streakVal}
            bestStreak={bestStreakVal}
            total={layerTotal}
            onrestart={startQuizSession}
          />
        {/if}
      </aside>

      <section class="relative flex-1 min-w-0 map-section">
        <MapView
          bind:this={mapView}
          onready={onMapReady}
          onhover={onMapHover}
          onclick={onMapClick}
        />

        {#if modeVal === 'quiz'}
          <QuizBanner
            targetName={currentTargetVal?.name ?? '—'}
            feedbackText={feedbackTextVal}
            feedbackClass={feedbackClassVal}
            onskip={handleSkip}
          />
        {/if}

        {#if showModalVal}
          <CompletionModal
            provinceName={provinceVal ?? ''}
            score={scoreVal}
            total={layerTotal}
            mistakes={mistakesVal}
            bestStreak={bestStreakVal}
            onplayAgain={startQuizSession}
            onclose={() => showModal.set(false)}
          />
        {/if}
      </section>

    </div>

  {/if}
</div>

<style>
  @media (max-width: 760px) {
    .layout-body { flex-direction: column; }
    .sidebar {
      width: 100% !important;
      max-height: 34vh;
      border-right: none !important;
      border-bottom: 1px solid rgba(0,0,0,0.12);
      order: 2;
    }
    .map-section {
      order: 1;
      min-height: 280px;
    }
  }
</style>