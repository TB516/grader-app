<script lang="ts">
  import { cubicOut } from 'svelte/easing';
  import { fly } from 'svelte/transition';
  import { projects } from '../../../shared/projects';
  import { type ProjectTypes } from '../../../shared/types';
  import Spinner from '../components/Spinner.svelte';

  let selectedProjectType = $state<ProjectTypes>('Simple HTTP');
  let titleDirection = $state(1);
  let projectUrl = $state('');
  let opening = $state(false);
  let errorMessage = $state('');

  const selectProject = (project: ProjectTypes): void => {
    if (project === selectedProjectType) return;

    const currentIndex = projects.indexOf(selectedProjectType);
    const nextIndex = projects.indexOf(project);
    titleDirection = nextIndex > currentIndex ? 1 : -1;
    selectedProjectType = project;
    errorMessage = '';
  };

  const handleSubmit = async (event: SubmitEvent, availableProjects: ProjectTypes[]): Promise<void> => {
    event.preventDefault();
    if (!availableProjects.includes(selectedProjectType) || opening) return;
    opening = true;
    errorMessage = '';
    try {
      await window.api.launchTester(selectedProjectType, projectUrl);
    } catch {
      errorMessage = 'Unable to open the grading window. Check the project URL and try again.';
    } finally {
      opening = false;
    }
  };
</script>

<svelte:head>
  <title>Grader</title>
</svelte:head>

<main class="app-shell">
  <svelte:boundary>
    {@const availableProjects = await window.api.availableProjects()}
    {@const canRun = availableProjects.includes(selectedProjectType)}
    <section class="workspace" aria-label="Project test setup">
      <nav aria-label="Assignments">
        <p>Assignments</p>
        {#each projects as project (project)}
          <button
            type="button"
            class:active={project === selectedProjectType}
            aria-pressed={project === selectedProjectType}
            onclick={() => selectProject(project)}
          >
            <span>{project}</span>
          </button>
        {/each}
      </nav>

      <form onsubmit={(event) => handleSubmit(event, availableProjects)}>
        <div class="form-heading">
          {#key selectedProjectType}
            <h2
              in:fly={{ y: titleDirection * 28, duration: 260, easing: cubicOut }}
              out:fly={{ y: titleDirection * -28, duration: 260, easing: cubicOut }}
            >
              {selectedProjectType}
            </h2>
          {/key}
        </div>

        <label for="project-url">Project URL</label>
        <div class="url-row">
          <input id="project-url" type="url" required placeholder="https://example.com" bind:value={projectUrl} />
          <button type="submit" disabled={!canRun || opening}>{opening ? 'Opening…' : 'Run Tests'}</button>
        </div>

        {#if errorMessage}
          <p class="hint" role="alert">{errorMessage}</p>
        {:else if !canRun}
          <p class="hint">The grader for this assignment is not available yet.</p>
        {:else}
          <p class="hint">Enter a reachable deployment URL. Results open in a separate grading window.</p>
        {/if}
      </form>
    </section>
    {#snippet pending()}
      <section class="notice" aria-label="Loading graders">
        <Spinner ariaLabel="Loading graders" />
        <p>Loading graders…</p>
      </section>
    {/snippet}

    <!-- eslint-disable-next-line @typescript-eslint/no-unused-vars -- Only the boundary's retry callback is needed. -->
    {#snippet failed(_error, reset)}
      <section class="notice">
        <h1>Unable to load graders</h1>
        <p role="alert">The assignment list could not be loaded. Try again.</p>
        <button class="retry" type="button" onclick={reset}>Try again</button>
      </section>
    {/snippet}
  </svelte:boundary>
</main>

<style>
  .app-shell {
    width: min(1120px, calc(100vw - 56px));
    min-height: 100vh;
    margin: 0 auto;
    padding: 56px 0 48px;
  }

  .notice {
    display: grid;
    justify-items: start;
    gap: 18px;
    padding: 24px 0;
    line-height: 1.5;
  }

  .notice h1 {
    font-size: 1.4rem;
    font-weight: 680;
  }

  .notice p {
    color: #aeb8b1;
  }

  .retry {
    border: 0;
    border-radius: 6px;
    padding: 12px 20px;
    color: #111507;
    background: #b9f56e;
    font-weight: 800;
    cursor: pointer;
  }

  nav p,
  .hint,
  label {
    color: #7f8782;
    font-size: 0.76rem;
    font-weight: 650;
    letter-spacing: 0;
    text-transform: uppercase;
  }

  .workspace {
    display: grid;
    grid-template-columns: minmax(220px, 300px) minmax(0, 1fr);
    min-height: 520px;
  }

  nav {
    padding: 22px 34px 34px 0;
  }

  nav p {
    margin-bottom: 20px;
  }

  nav button {
    display: flex;
    width: 100%;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    border: 0;
    padding: 13px 2px;
    color: #8d9691;
    background: transparent;
    text-align: left;
    cursor: pointer;
    transition:
      color 160ms ease,
      transform 160ms ease;
  }

  nav button:hover {
    color: #f1f4ec;
    transform: translateX(2px);
  }

  nav button::after {
    width: 7px;
    height: 7px;
    border-radius: 999px;
    background: #303633;
    content: '';
  }

  nav button.active {
    color: #f3f4ef;
  }

  nav button.active::after {
    background: #b9f56e;
    box-shadow: 0 0 18px rgb(185 245 110 / 45%);
  }

  nav span {
    overflow-wrap: anywhere;
  }

  form {
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 46px 0 46px 64px;
  }

  .form-heading {
    display: grid;
    margin-bottom: 54px;
  }

  h2 {
    grid-area: 1 / 1;
    color: #f3f4ef;
    font-size: clamp(2.8rem, 5.1vw, 4.9rem);
    font-weight: 680;
    line-height: 0.9;
    letter-spacing: 0;
    white-space: nowrap;
  }

  label {
    margin-bottom: 10px;
  }

  .url-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 12px;
    max-width: 760px;
  }

  input {
    min-width: 0;
    border: 0;
    border-radius: 6px;
    padding: 18px 18px;
    color: #f3f4ef;
    background: #111417;
    outline: none;
    transition:
      background 160ms ease,
      box-shadow 160ms ease;
  }

  input::placeholder {
    color: #555f5a;
  }

  input:focus {
    background: #151a1d;
    box-shadow: 0 0 0 1px #b9f56e;
  }

  form button {
    border: 0;
    border-radius: 6px;
    padding: 0 28px;
    color: #111507;
    background: #b9f56e;
    font-weight: 800;
    cursor: pointer;
    transition:
      background 160ms ease,
      transform 160ms ease;
  }

  form button:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  form button:hover:not(:disabled) {
    background: #d5ff91;
    transform: translateY(-1px);
  }

  .hint {
    margin-top: 18px;
    color: #69716d;
    text-transform: none;
  }

  @media (max-width: 760px) {
    .app-shell {
      width: min(100% - 32px, 680px);
      padding-top: 24px;
    }

    .workspace {
      display: block;
      min-height: 0;
    }

    nav {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 0 18px;
      padding-right: 0;
    }

    nav p {
      grid-column: 1 / -1;
    }

    form {
      padding: 34px 0 0;
    }

    h2 {
      font-size: clamp(2.2rem, 9vw, 3.1rem);
    }

    .url-row {
      grid-template-columns: 1fr;
    }

    form button {
      min-height: 52px;
    }
  }
</style>
