<script lang="ts">
  import { searchParams } from 'sv-router';
  import { onMount } from 'svelte';
  import type { GraderRun, ProjectTypes } from '../../../shared/types';
  import GraderResultRow from '../components/GraderResultRow.svelte';
  import ResultsSummary from '../components/ResultsSummary.svelte';

  type PageStatus = 'starting' | 'running' | 'done' | 'error';

  const projectUrl = searchParams.get('url') as string;
  const projectType = searchParams.get('assignment') as ProjectTypes;

  let pageStatus = $state<PageStatus>(projectUrl ? 'starting' : 'error');
  let errorMessage = $state(projectUrl ? '' : 'Missing project URL.');
  let graders = $state<GraderRun[]>([]);

  const completedCount = (): number => graders.filter((run) => run.result !== null).length;
  const statusCount = (status: 'pass' | 'fail' | 'error'): number => graders.filter((run) => run.result?.status === status).length;
  const pendingCount = (): number => graders.filter((run) => run.result === null).length;

  const mergeGraderRun = (incomingRun: GraderRun): void => {
    const existingIndex = graders.findIndex((run) => run.label === incomingRun.label);

    if (existingIndex === -1) {
      graders = [...graders, incomingRun];
      return;
    }

    graders = graders.map((run, index) => (index === existingIndex ? { ...run, ...incomingRun } : run));
  };

  const mergeInitialGraderRuns = (initialRuns: GraderRun[]): void => {
    const streamedRuns = new Map(graders.map((run) => [run.label, run]));
    const mergedRuns = initialRuns.map((run) => streamedRuns.get(run.label) ?? run);
    const extraStreamedRuns = graders.filter((run) => !initialRuns.some((initialRun) => initialRun.label === run.label));

    graders = [...mergedRuns, ...extraStreamedRuns];
  };

  onMount(() => {
    if (!projectUrl) {
      return;
    }

    const unsubscribeFromGraderUpdate = window.api.subscribeToGraderUpdate((run) => {
      mergeGraderRun(run);
    });
    const unsubscribeFromGraderDone = window.api.subscribeToGraderDone(() => {
      pageStatus = 'done';
      unsubscribeFromGraderUpdate();
    });

    const startGrading = async (): Promise<void> => {
      try {
        pageStatus = 'running';
        mergeInitialGraderRuns(await window.api.testProject(projectType, projectUrl));
      } catch (error) {
        pageStatus = 'error';
        errorMessage = error instanceof Error ? error.message : 'Unable to start grading.';
      }
    };

    void startGrading();

    return () => {
      unsubscribeFromGraderUpdate();
      unsubscribeFromGraderDone();
    };
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
        <a href={projectUrl}>{projectUrl}</a>
      {/if}
    </div>
    {#if pageStatus !== 'done'}
      <span class:running={pageStatus === 'running'} class:error={pageStatus === 'error'}>{pageStatus}</span>
    {/if}
  </header>

  {#if pageStatus === 'error'}
    <section class="notice error">
      <strong>Unable to run graders</strong>
      <p>{errorMessage}</p>
    </section>
  {:else}
    <ResultsSummary
      total={graders.length}
      complete={completedCount()}
      passed={statusCount('pass')}
      failed={statusCount('fail')}
      errors={statusCount('error')}
      pending={pendingCount()}
    />

    {#if graders.length === 0}
      <section class="notice">
        <strong>Starting graders</strong>
        <p>The initial grader list has not been received yet.</p>
      </section>
    {:else}
      <ol class="graders" aria-label="Graders">
        {#each graders as grader (grader.label)}
          <GraderResultRow {grader} />
        {/each}
      </ol>
    {/if}
  {/if}
</main>

<style>
  :global(*) {
    box-sizing: border-box;
  }

  :global(body) {
    min-width: 720px;
    color: #f3f4ef;
    background: #08090b;
    font-family:
      Aptos,
      'Segoe UI Variable',
      'Segoe UI',
      ui-sans-serif,
      system-ui,
      -apple-system,
      sans-serif;
    font-feature-settings: 'ss01' on;
  }

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
    :global(body) {
      min-width: 0;
    }

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
