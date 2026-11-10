<script lang="ts">
  import './reset.css';
  import './styles.css';
  import Launcher from './pages/Launcher.svelte';
  import Results from './pages/Results.svelte';

  const view = new URLSearchParams(location.search).get('view');
</script>

{#if view === 'results'}
  <Results />
{:else}
  <Launcher />
{/if}
