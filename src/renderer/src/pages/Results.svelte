<script lang="ts">
  import { searchParams } from 'sv-router';
  import { onMount } from 'svelte';
  import type { GraderRun, ProjectTypes } from '../../../shared/types';

  type PageStatus = 'starting' | 'running' | 'done' | 'error';

  let pageStatus: PageStatus = 'starting';
  let errorMessage = '';
  let projectUrl = '';
  let projectType: ProjectTypes;
  let graders: GraderRun[] = [];

  const statusLabel = (run: GraderRun): string => run.result?.status ?? 'pending';

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

<main>
  <header>
    <p>{projectType ?? 'Project'} results</p>
    <h1>Grading Results</h1>
    {#if projectUrl}
      <a href={projectUrl}>{projectUrl}</a>
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
        <span>Passed</span>
        <strong>{graders.filter((run) => run.result?.status === 'pass').length}</strong>
      </div>
      <div>
        <span>Failed</span>
        <strong>{graders.filter((run) => run.result?.status === 'fail').length}</strong>
      </div>
      <div>
        <span>Errors</span>
        <strong>{graders.filter((run) => run.result?.status === 'error').length}</strong>
      </div>
      <div>
        <span>Pending</span>
        <strong>{graders.filter((run) => run.result === null).length}</strong>
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

              {#if grader.result.details}
                <pre>{grader.result.details}</pre>
              {/if}
            {:else}
              <p>Pending</p>
            {/if}
          </li>
        {/each}
      </ol>
    {/if}
  {/if}
</main>

<style>
  :global(body) {
    min-width: 560px;
    color: #17202a;
    background: #f6f8fb;
    font-family:
      Inter,
      ui-sans-serif,
      system-ui,
      -apple-system,
      BlinkMacSystemFont,
      'Segoe UI',
      sans-serif;
  }

  main {
    width: min(960px, calc(100vw - 48px));
    margin: 0 auto;
    padding: 40px 0;
  }

  header {
    margin-bottom: 28px;
  }

  header p,
  header a {
    margin: 0;
    color: #5c6b7a;
    font-size: 0.95rem;
  }

  header a {
    display: inline-block;
    max-width: 100%;
    overflow-wrap: anywhere;
  }

  h1 {
    margin: 8px 0;
    font-size: 2.2rem;
    line-height: 1.1;
  }

  .summary {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 12px;
    margin-bottom: 18px;
  }

  .summary div,
  .notice,
  .graders li {
    border: 1px solid #d8e0ea;
    border-radius: 8px;
    background: #ffffff;
    box-shadow: 0 8px 24px rgb(25 38 52 / 6%);
  }

  .summary div {
    padding: 14px;
  }

  .summary span {
    display: block;
    color: #657386;
    font-size: 0.82rem;
  }

  .summary strong {
    display: block;
    margin-top: 4px;
    font-size: 1.55rem;
  }

  .notice {
    padding: 22px;
  }

  .notice p {
    margin: 8px 0 0;
    color: #5c6b7a;
  }

  .notice.error {
    border-color: #f2b6b6;
    background: #fff7f7;
  }

  .graders {
    display: grid;
    gap: 12px;
    padding: 0;
    list-style: none;
  }

  .graders li {
    padding: 18px;
    border-left-width: 6px;
  }

  .graders li.pending {
    border-left-color: #9aa8b7;
  }

  .graders li.pass {
    border-left-color: #21845a;
  }

  .graders li.fail {
    border-left-color: #c94835;
  }

  .graders li.error {
    border-left-color: #a747c9;
  }

  .grader-heading {
    display: flex;
    gap: 16px;
    align-items: flex-start;
    justify-content: space-between;
  }

  h2 {
    margin: 0;
    font-size: 1rem;
  }

  .grader-heading span {
    flex: 0 0 auto;
    min-width: 76px;
    border-radius: 999px;
    padding: 5px 10px;
    color: #ffffff;
    background: #697789;
    text-align: center;
    text-transform: capitalize;
    font-size: 0.78rem;
    font-weight: 700;
  }

  .pass .grader-heading span {
    background: #21845a;
  }

  .fail .grader-heading span {
    background: #c94835;
  }

  .error .grader-heading span {
    background: #a747c9;
  }

  .graders p {
    margin: 10px 0 0;
    color: #4d5b6a;
  }

  pre {
    overflow-x: auto;
    margin: 12px 0 0;
    border-radius: 6px;
    padding: 12px;
    background: #111827;
    color: #edf2f7;
    white-space: pre-wrap;
  }

  @media (max-width: 700px) {
    :global(body) {
      min-width: 0;
    }

    main {
      width: min(100% - 28px, 960px);
      padding: 24px 0;
    }

    .summary {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .grader-heading {
      flex-direction: column;
      gap: 10px;
    }
  }
</style>
