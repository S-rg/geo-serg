<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { browser } from '$app/environment';
  import { STYLE } from '$lib/utils/mapStyles.js';
  import { REDUCED_MOTION } from '$lib/utils/helpers.js';
  import { mode, completedIds, layersById } from '$lib/stores/appState.js';
  import type {
    AppMode, ClickPayload, HoverPayload,
    SubdivisionLayer, LayersById, ProvincesData, RippleVariant,
  } from '$lib/types.js';

  interface Props {
    onready?: () => void;
    onhover?: (payload: HoverPayload) => void;
    onclick?: (payload: ClickPayload) => void;
  }

  let { onready, onhover, onclick }: Props = $props();

  let mapEl = $state<HTMLDivElement>(null!);
  // Leaflet types — imported dynamically so they never load on the server
  let L:         typeof import('leaflet');
  let map:       import('leaflet').Map;
  let layerGroup: import('leaflet').GeoJSON | null = null;

  let modeVal         = $state<AppMode>('explore');
  let completedIdsVal = $state<Set<string>>(new Set());

  mode.subscribe(v => (modeVal = v));
  completedIds.subscribe(v => (completedIdsVal = v));

  /* ── Exported imperative API ────────────────────────────────── */
  export function loadGeoJSON(geojson: ProvincesData[string]): void {
    if (layerGroup) map.removeLayer(layerGroup);

    const newLayersById: LayersById = {};

    layerGroup = L.geoJSON(geojson, {
      style: (feat) =>
        baseStyleFor(modeVal, feat?.properties?.['id'] as string | undefined),
      onEachFeature(_feature, layer) {
        const kab = layer as unknown as SubdivisionLayer;
        kab.on('mouseover', () =>
          onhover?.({ feature: kab.feature, layer: kab, entering: true }));
        kab.on('mouseout', () =>
          onhover?.({ feature: kab.feature, layer: kab, entering: false }));
        kab.on('click', () =>
          onclick?.({ feature: kab.feature, layer: kab }));
      },
    }).addTo(map);

    layerGroup.eachLayer(l => {
      const kab = l as unknown as SubdivisionLayer;
      newLayersById[kab.feature.properties.id] = kab;
    });

    layersById.set(newLayersById);
    map.fitBounds(layerGroup.getBounds(), { padding: [40, 40] });
  }

  export function applyModeStyles(): void {
    let layers: LayersById = {};
    const unsub = layersById.subscribe(v => (layers = v));
    unsub();

    Object.entries(layers).forEach(([id, layer]) => {
      layer.setStyle(baseStyleFor(modeVal, id));
      if (modeVal === 'explore') {
        if (!layer._tooltipBound) {
          layer.bindTooltip(layer.feature.properties.name, {
            sticky: true, direction: 'top', className: 'kab-tooltip', opacity: 0.97,
          });
          layer._tooltipBound = true;
        }
      } else if (layer._tooltipBound) {
        layer.closeTooltip();
        layer.unbindTooltip();
        layer._tooltipBound = false;
      }
    });
  }

  export function flyToLayer(layer: SubdivisionLayer): void {
  const center = layer.getBounds().getCenter();

  if (REDUCED_MOTION) {
    map.panTo(center, { animate: false });
  } else {
    map.panTo(center, { animate: true, duration: 0.6 });
  }
}

  export function refit(): void {
    if (layerGroup) map.fitBounds(layerGroup.getBounds(), { padding: [40, 40] });
  }

  export function ripple(latlng: import('leaflet').LatLng, variant: RippleVariant): void {
    const icon = L.divIcon({
      className: '',
      html: `<div class="ripple ripple-${variant}"></div>`,
      iconSize: [0, 0],
    });
    const m = L.marker(latlng, { icon, interactive: false, zIndexOffset: 1000 }).addTo(map);
    setTimeout(() => map.removeLayer(m), REDUCED_MOTION ? 50 : 900);
  }

  function baseStyleFor(
    mode: AppMode,
    id: string | undefined,
  ): import('leaflet').PathOptions {
    if (mode === 'quiz' || mode === 'typing') {
      if (id && completedIdsVal.has(id)) return STYLE.completed;
      return STYLE.quizDefault;
    }
    return STYLE.exploreDefault;
  }

  let _ro: ResizeObserver | null = null;
  let _fixUp: (() => void) | null = null;

  onMount(() => {
    initMap();
  });

  async function initMap(): Promise<void> {
    L = await import('leaflet');

    map = L.map(mapEl, {
      zoomControl: true,
      scrollWheelZoom: true,
      minZoom: 2,
      maxZoom: 13,
      maxBoundsViscosity: 0.6,
    }).setView([-2.5, 117], 5);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> ' +
        'contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map);

    _fixUp = (): void => { map.invalidateSize(); refit(); };
    _ro = window.ResizeObserver ? new ResizeObserver(_fixUp) : null;
    _ro?.observe(mapEl.parentElement as Element);
    window.addEventListener('resize', _fixUp);
    requestAnimationFrame(_fixUp);
    setTimeout(_fixUp, 300);
    if (document.fonts?.ready) document.fonts.ready.then(_fixUp);

    onready?.();
  }

  onDestroy(() => {
    _ro?.disconnect();
    if (_fixUp) window.removeEventListener('resize', _fixUp);
    map?.remove();
  });
</script>

{#if browser}
  <div bind:this={mapEl} class="absolute inset-0" style="background:var(--paper)"></div>
{/if}