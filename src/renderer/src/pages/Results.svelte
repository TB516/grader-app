<script lang="ts">
  import { onMount } from 'svelte';
  import type { GraderRun } from '../../../shared/types';
  import GraderResultRow from '../components/GraderResultRow.svelte';
  import ResultsSummary from '../components/ResultsSummary.svelte';

  type PageStatus = 'starting' | 'running' | 'completed' | 'cancelled' | 'error';

  const query = new URLSearchParams(window.location.search);
  const projectUrl = query.get('url');
  const projectType = query.get('assignment');
  const runId = crypto.randomUUID();
  let pageStatus = $state<PageStatus>('starting');
  let errorMessage = $state('');
  let graders = $state<GraderRun[]>([]);

  onMount(() => {
    if (!projectUrl || !projectType) {
      pageStatus = 'error';
      errorMessage = 'Missing assignment or project URL.';
      return;
    }

    return window.api.gradeProject({ runId, assignment: projectType, url: projectUrl }, (event) => {
      switch (event.type) {
        case 'started':
          graders = event.checks;
          pageStatus = 'running';
          break;
        case 'result':
          graders = graders.map((check) => (check.id === event.check.id ? event.check : check));
          break;
        case 'finished':
          pageStatus = event.outcome;
          errorMessage = event.message ?? '';
          break;
      }
    });
  });
</script>

<svelte:head>
  <title>Grading Results</title>
</svelte:head>

<main class="results-shell">
  <header class="topbar">
    <div>
      <p>{projectType ?? 'Project'}</p>
      {#if projectUrl}
        <a href={projectUrl} target="_blank" rel="noreferrer">{projectUrl}</a>
      {/if}
    </div>
    {#if pageStatus === 'running'}
      <button type="button" onclick={() => window.api.cancelGrading(runId)}>Cancel</button>
    {/if}
    {#if pageStatus !== 'completed'}
      <span class:running={pageStatus === 'running'} class:error={pageStatus === 'error'}>{pageStatus}</span>
    {/if}
  </header>

  {#if pageStatus === 'error'}
    <section class="notice error">
      <strong>Unable to run graders</strong>
      <p>{errorMessage}</p>
    </section>
  {:else}
    <ResultsSummary {graders} />

    {#if graders.length === 0}
      <section class="notice">
        <strong>Starting graders</strong>
        <p>The initial grader list has not been received yet.</p>
      </section>
    {:else}
      <ol class="graders" aria-label="Graders">
        {#each graders as grader (grader.id)}
          <GraderResultRow {grader} />
        {/each}
      </ol>
    {/if}
  {/if}
</main>

<style>
  .results-shell {
    width: min(1180px, calc(100vw - 56px));
    min-height: 100vh;
    margin: 0 auto;
    padding: 30px 0 48px;
  }

  .topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
    margin-bottom: 24px;
  }

  .topbar p,
  .topbar a {
    color: #7f8782;
    font-size: 0.9rem;
  }

  .topbar a {
    display: inline-block;
    max-width: 100%;
    margin-top: 5px;
    color: #aeb8b1;
    overflow-wrap: anywhere;
    text-decoration-color: rgb(174 184 177 / 35%);
    text-underline-offset: 3px;
  }

  .topbar > span {
    flex: 0 0 auto;
    border-radius: 999px;
    padding: 7px 11px;
    color: #aeb8b1;
    background: #111417;
    text-transform: capitalize;
    font-size: 0.84rem;
    font-weight: 800;
  }

  .topbar > span.running {
    color: #111507;
    background: #22c55e;
  }

  .topbar > span.error {
    color: #180b0b;
    background: #ef4444;
  }

  .topbar button {
    border: 1px solid #69716d;
    border-radius: 6px;
    padding: 8px 14px;
    color: #f3f4ef;
    background: #111417;
    cursor: pointer;
  }

  .notice {
    margin-top: 24px;
    padding: 18px;
    border-radius: 6px;
    background: #111417;
  }

  .notice p {
    margin: 8px 0 0;
    color: #aeb8b1;
  }

  .notice.error {
    color: #ffd6dc;
    background: #1a1012;
  }

  .graders {
    padding: 0;
    list-style: none;
  }

  @media (max-width: 760px) {
    .results-shell {
      width: min(100% - 32px, 960px);
      padding: 24px 0;
    }

    .topbar {
      flex-direction: column;
      align-items: flex-start;
    }
  }
</style>
