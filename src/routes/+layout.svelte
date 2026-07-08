<script lang="ts">
  import '../app.css';
  import CLI from '$lib/components/CLI.svelte';
  import type { Snippet } from 'svelte';
  import { parseCommand, runCommand } from '$lib/cli/commands';

  let { children }: { children: Snippet } = $props();

  function handleCommand(raw: string): void {
    const { name, args } = parseCommand(raw);
    const ok = runCommand(name, args);
    if (!ok) console.warn(`Unknown command: ${name}`);
  }
</script>

{@render children()}
<CLI oncommand={handleCommand} />