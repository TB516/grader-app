<script lang="ts">
  import type { CheckResult } from '../../../shared/grading';
  import CheckRow from '../components/CheckRow.svelte';

  const query = new URLSearchParams(location.search);
  const assignment = query.get('assignment') ?? '';
  const address = query.get('url') ?? '';
  const host = URL.parse(address)?.host ?? address;

  let rows = $state<{ label: string; result: CheckResult | undefined }[]>([]);
  let cancelled = $state(false);
  let copied = $state(false);

  const countOf = (status: CheckResult['status']) =>
    rows.filter((row) => row.result?.status === status).length;
  const checked = $derived(rows.filter((row) => row.result).length);
  const finished = $derived(rows.length > 0 && checked === rows.length);

  const headline = $derived.by(() => {
    if (rows.length === 0) return 'Starting…';
    if (finished) return `${countOf('passed')} of ${rows.length} checks passed`;
    if (cancelled) return `Cancelled after ${checked} of ${rows.length} checks`;
    return `Checking… ${checked} of ${rows.length} done`;
  });

  const cancelRun = window.api.grade((event) => {
    if (event.type === 'started') {
      rows = event.checks.map((label) => ({ label, result: undefined }));
      return;
    }

    const row = rows[event.index];
    if (row) row.result = event.result;
  });

  const cancel = () => {
    cancelRun();
    cancelled = true;
  };

  const marks = { passed: '✓', failed: '✗', error: '!' };

  /** Plain text for pasting into feedback. */
  const copyResults = async () => {
    const lines = rows.map(({ label, result }) => {
      if (!result) return `– ${label}: not run`;
      return `${marks[result.status]} ${label}: ${result.message}`;
    });
    await navigator.clipboard.writeText([`${assignment}: ${address}`, ...lines].join('\n'));

    copied = true;
    setTimeout(() => (copied = false), 2000);
  };
</script>

<svelte:head>
  <title>{assignment} – {host}</title>
</svelte:head>

<header>
  <div>
    <h1>{headline}</h1>
    <p class="submission">{assignment} at {address}</p>
  </div>

  <div class="actions">
    {#if finished || cancelled}
      <button onclick={copyResults}>{copied ? 'Copied' : 'Copy results'}</button>
      <button class="primary" onclick={() => location.reload()}>Run again</button>
    {:else}
      <button onclick={cancel}>Cancel</button>
    {/if}
  </div>
</header>

<main>
  {#if countOf('failed') + countOf('error') > 0}
    <p class="problems">
      {#if countOf('failed') > 0}<span class="failed">{countOf('failed')} failed</span>{/if}
      {#if countOf('error') > 0}<span class="error">{countOf('error')} couldn't be checked</span
        >{/if}
    </p>
  {/if}

  <ol>
    {#each rows as row, index (index)}
      <CheckRow label={row.label} result={row.result} {cancelled} />
    {/each}
  </ol>
</main>

<style>
  header {
    position: sticky;
    top: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem 2rem;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 1.5rem;
    border-bottom: 1px solid var(--border);
    background: var(--surface);
  }

  h1 {
    font-size: 1.25rem;
    font-weight: 700;
    line-height: 1.3;
  }

  .submission {
    color: var(--muted);
    font-size: 0.875rem;
    overflow-wrap: anywhere;
  }

  .actions {
    display: flex;
    gap: 0.5rem;
  }

  main {
    max-width: 56rem;
    padding: 1.25rem 1.5rem 2rem;
    margin: 0 auto;
  }

  .problems {
    display: flex;
    gap: 1rem;
    padding-bottom: 0.75rem;
    font-weight: 600;
  }

  .failed {
    color: var(--failed);
  }

  .error {
    color: var(--error);
  }

  ol {
    padding: 0.375rem 0;
    border: 1px solid var(--border);
    border-radius: 8px;
    background: var(--surface);
    list-style: none;
  }
</style>
