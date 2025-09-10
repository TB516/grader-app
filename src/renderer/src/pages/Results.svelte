<script lang="ts">
  import { searchParams } from 'sv-router';
  import { onMount } from 'svelte';

  onMount(() => {
    const projUrl = searchParams.get('url');
    const projType = searchParams.get('assignment');
  });
</script>
