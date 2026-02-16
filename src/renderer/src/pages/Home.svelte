<script lang="ts">
  import { projects, type ProjectTypes } from '../../../../resources/projects';

  let selectedProjectType: ProjectTypes = 'Simple HTTP';
  let projectUrl: string;

  const handleSubmit = (): void => {
    window.api.launchTester(selectedProjectType, projectUrl);
  };
</script>

<header>
  <nav>
    {#each projects as project (project)}
      <button disabled={project === selectedProjectType} onclick={() => (selectedProjectType = project)}>
        {project}
      </button>
    {/each}
  </nav>

  <h1>{selectedProjectType}</h1>
</header>

<main>
  <form onsubmit={handleSubmit}>
    <input type="url" required placeholder="Project URL" bind:value={projectUrl} />

    <button type="submit">Test Project</button>
  </form>
</main>

<style>
  main {
    display: flex;

    width: 100vw;
    height: 100vh;

    justify-content: center;
    align-items: center;
  }
</style>
