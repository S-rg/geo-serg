<!-- src/routes/fsm/[country]/custom/+page.svelte -->
<script lang="ts">
  import AtlasPage from '$lib/components/CommonPage.svelte';
  import type { PageData } from './$types.js';
  import { currentLevel, parentDivisionName } from '$lib/stores/appState.js';
  import { page } from '$app/state';

  let { data }: { data: PageData } = $props();

  $effect(() => {
    currentLevel.set('adm2');
    parentDivisionName.set(page.params.country ?? null);
  });
</script>

<AtlasPage {data} />