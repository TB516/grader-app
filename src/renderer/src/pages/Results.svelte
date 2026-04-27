<script lang="ts">
  import { searchParams } from 'sv-router';
  import { onMount } from 'svelte';
  import Spinner from '../components/Spinner.svelte';
  import type { GraderRun, ProjectTypes } from '../../../shared/types';

  type PageStatus = 'starting' | 'running' | 'done' | 'error';

  let pageStatus: PageStatus = 'starting';
  let errorMessage = '';
  let projectUrl = '';
  let projectType: ProjectTypes;
  let graders: GraderRun[] = [];

  const statusLabel = (run: GraderRun): string => run.result?.status ?? 'pending';
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
    const projUrl = searchParams.get('url') as string;
    const projType = (searchParams.get('assignment') as ProjectTypes)!;

    if (!projUrl) {
      pageStatus = 'error';
      errorMessage = 'Missing project URL.';
      return;
    }

    projectUrl = projUrl;
    projectType = projType;

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
        mergeInitialGraderRuns(await window.api.testProject(projectType, projUrl));
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
    <section class="summary" aria-label="Grading summary">
      <div>
        <span>Total</span>
        <strong>{graders.length}</strong>
      </div>
      <div>
        <span>Complete</span>
        <strong>{completedCount()}</strong>
      </div>
      <div>
        <span>Passed</span>
        <strong>{statusCount('pass')}</strong>
      </div>
      <div>
        <span>Failed</span>
        <strong>{statusCount('fail')}</strong>
      </div>
      <div>
        <span>Errors</span>
        <strong>{statusCount('error')}</strong>
      </div>
      <div>
        <span>Pending</span>
        <strong>{pendingCount()}</strong>
      </div>
    </section>

    {#if graders.length === 0}
      <section class="notice">
        <strong>Starting graders</strong>
        <p>The initial grader list has not been received yet.</p>
      </section>
    {:else}
      <ol class="graders" aria-label="Graders">
        {#each graders as grader (grader.label)}
          <li
            class:pending={grader.result === null}
            class:pass={grader.result?.status === 'pass'}
            class:fail={grader.result?.status === 'fail'}
            class:error={grader.result?.status === 'error'}
          >
            <div class="grader-heading">
              <h2>{grader.label}</h2>
              <span>{statusLabel(grader)}</span>
            </div>

            {#if grader.result}
              <p>{grader.result.message}</p>

              {#if grader.result.details && grader.result.status !== 'pass'}
                <details>
                  <summary>Details</summary>
                  <pre>{grader.result.details}</pre>
                </details>
              {/if}
            {:else}
              <p class="pending-message">
                <Spinner ariaLabel="Waiting for grader result" />
                Waiting for result
              </p>
            {/if}
          </li>
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

  .summary {
    display: grid;
    grid-template-columns: repeat(6, minmax(0, 1fr));
    gap: 10px;
    position: sticky;
    top: 0;
    z-index: 1;
    margin-bottom: 18px;
    padding: 12px 0;
    background: rgb(8 9 11 / 92%);
    backdrop-filter: blur(12px);
  }

  .summary div {
    padding: 12px 0;
  }

  .summary span {
    display: block;
    color: #717a75;
    font-size: 0.76rem;
    font-weight: 650;
    text-transform: uppercase;
  }

  .summary strong {
    display: block;
    margin-top: 6px;
    color: #f3f4ef;
    font-size: 2rem;
    font-weight: 680;
    line-height: 1;
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

  .graders li {
    display: grid;
    grid-template-columns: minmax(220px, 0.8fr) minmax(0, 1.2fr);
    gap: 22px;
    padding: 20px 0;
    border-bottom: 1px solid #1b2023;
  }

  .graders li.pass {
    border-left: 3px solid #22c55e;
    padding-left: 16px;
  }

  .graders li.fail {
    border-left: 3px solid #ef4444;
    padding-left: 16px;
  }

  .graders li.error {
    border-left: 3px solid #facc15;
    padding-left: 16px;
  }

  .graders li.pending {
    border-left: 3px solid #6b7280;
    padding-left: 16px;
  }

  .grader-heading {
    display: flex;
    gap: 16px;
    align-items: flex-start;
    justify-content: space-between;
  }

  h2 {
    margin: 0;
    color: #f3f4ef;
    font-size: 1.05rem;
    font-weight: 680;
    line-height: 1.35;
  }

  .grader-heading span {
    flex: 0 0 auto;
    min-width: 76px;
    padding: 5px 10px;
    border-radius: 999px;
    color: #aeb8b1;
    background: #111417;
    text-align: center;
    text-transform: capitalize;
    font-size: 0.78rem;
    font-weight: 700;
  }

  .pass .grader-heading span {
    color: #06130a;
    background: #22c55e;
  }

  .fail .grader-heading span {
    color: #fff1f2;
    background: #991b1b;
  }

  .error .grader-heading span {
    color: #1c1400;
    background: #facc15;
  }

  .pending .grader-heading span {
    color: #e5e7eb;
    background: #374151;
  }

  .graders p {
    margin: 0;
    color: #aeb8b1;
    line-height: 1.5;
  }

  .pending-message {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  details {
    margin-top: 12px;
  }

  summary {
    width: fit-content;
    color: #dce3dd;
    font-size: 0.9rem;
    font-weight: 700;
    cursor: pointer;
  }

  summary::marker {
    color: #7f8782;
  }

  pre {
    overflow-x: auto;
    margin: 12px 0 0;
    border-left: 1px solid #323a36;
    padding: 4px 0 4px 14px;
    color: #dce3dd;
    white-space: pre-wrap;
    line-height: 1.45;
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

    .summary {
      position: static;
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }

    .summary div {
      padding-bottom: 8px;
    }

    .graders li {
      grid-template-columns: 1fr;
      gap: 12px;
    }
  }
</style>
