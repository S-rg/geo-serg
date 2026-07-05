<!-- src/routes/fsm/custom/+page.svelte -->
<script lang="ts">
  import AtlasPage from '$lib/components/CommonPage.svelte';
  import type { PageData } from './$types.js';

  let { data }: { data: PageData } = $props();
</script>

<AtlasPage {data} />