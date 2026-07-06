<!-- src/routes/fsm/[country]/[state]/+page.svelte -->
<script lang="ts">
  import AtlasPage from '$lib/components/CommonPage.svelte';
  import type { PageData } from './$types.js';
  import { page } from '$app/state';
  import { currentLevel, parentDivisionName } from '$lib/stores/appState.js';

  let { data }: { data: PageData } = $props();

  $effect(() => {
    parentDivisionName.set(page.params.country ?? null);
    currentLevel.set('adm2');
  });
</script>

<AtlasPage {data} />