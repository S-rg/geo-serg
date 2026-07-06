<!-- src/routes/fsm/custom/+page.svelte -->
<script lang="ts">
  import AtlasPage from '$lib/components/CommonPage.svelte';
  import type { PageData } from './$types.js';
  import { currentLevel, parentDivisionName } from '$lib/stores/appState.js';
  currentLevel.set('adm2');
  parentDivisionName.set('world');

  let { data }: { data: PageData } = $props();
</script>

<AtlasPage {data} />