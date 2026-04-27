<script lang="ts">
  import { projects } from '../../../shared/projects';
  import { type ProjectTypes } from '../../../shared/types';

  let selectedProjectType: ProjectTypes = 'Simple HTTP';
  let projectUrl = '';

  const selectProject = (project: ProjectTypes): void => {
    if (project === selectedProjectType) return;

    const currentIndex = projects.indexOf(selectedProjectType);
    const nextIndex = projects.indexOf(project);
    const directionClass = nextIndex > currentIndex ? 'project-transition-down' : 'project-transition-up';
    const transitionDocument = document as Document & {
      startViewTransition?: (update: () => void) => { finished: Promise<void> };
    };
    const updateProject = (): void => {
      selectedProjectType = project;
    };

    if (transitionDocument.startViewTransition) {
      document.documentElement.classList.add(directionClass);
      const transition = transitionDocument.startViewTransition(updateProject);
      void transition.finished.finally(() => {
        document.documentElement.classList.remove(directionClass);
      });
      return;
    }

    updateProject();
  };

  const handleSubmit = (): void => {
    window.api.launchTester(selectedProjectType, projectUrl);
  };
</script>

<svelte:head>
  <title>Grader</title>
</svelte:head>

<main class="app-shell">
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

    <form onsubmit={handleSubmit}>
      <div class="form-heading">
        <h2>{selectedProjectType}</h2>
      </div>

      <label for="project-url">Project URL</label>
      <div class="url-row">
        <input id="project-url" type="url" required placeholder="https://example.com" bind:value={projectUrl} />
        <button type="submit">Run Tests</button>
      </div>

      <p class="hint">Enter a reachable deployment URL. Results open in a separate grading window.</p>
    </form>
  </section>
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

  :global(button),
  :global(input) {
    font: inherit;
  }

  .app-shell {
    width: min(1120px, calc(100vw - 56px));
    min-height: 100vh;
    margin: 0 auto;
    padding: 56px 0 48px;
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
    margin-bottom: 54px;
  }

  h2 {
    color: #f3f4ef;
    font-size: clamp(2.8rem, 5.1vw, 4.9rem);
    font-weight: 680;
    line-height: 0.9;
    letter-spacing: 0;
    white-space: nowrap;
    view-transition-name: project-title;
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

  form button:hover {
    background: #d5ff91;
    transform: translateY(-1px);
  }

  .hint {
    margin-top: 18px;
    color: #69716d;
    text-transform: none;
  }

  :global(::view-transition-old(project-title)),
  :global(::view-transition-new(project-title)) {
    animation-duration: 260ms;
    animation-timing-function: cubic-bezier(0.2, 0.8, 0.2, 1);
  }

  :global(.project-transition-down::view-transition-old(project-title)) {
    animation-name: title-out-up;
  }

  :global(.project-transition-down::view-transition-new(project-title)) {
    animation-name: title-in-up;
  }

  :global(.project-transition-up::view-transition-old(project-title)) {
    animation-name: title-out-down;
  }

  :global(.project-transition-up::view-transition-new(project-title)) {
    animation-name: title-in-down;
  }

  @keyframes title-in-up {
    from {
      opacity: 0;
      transform: translateY(28px);
    }

    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes title-out-up {
    from {
      opacity: 1;
      transform: translateY(0);
    }

    to {
      opacity: 0;
      transform: translateY(-28px);
    }
  }

  @keyframes title-in-down {
    from {
      opacity: 0;
      transform: translateY(-28px);
    }

    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes title-out-down {
    from {
      opacity: 1;
      transform: translateY(0);
    }

    to {
      opacity: 0;
      transform: translateY(28px);
    }
  }

  @media (max-width: 760px) {
    :global(body) {
      min-width: 0;
    }

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
