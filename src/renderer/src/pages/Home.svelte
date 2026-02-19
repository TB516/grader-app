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
  header {
    display: flex;
    flex-direction: column;

    height: 25vh;
  }

  header nav {
    display: flex;

    height: 60%;
  }

  nav button {
    flex: 1;

    border: none;

    font-size: large;
    font-weight: bold;

    color: white;
    background-color: maroon;
  }
  nav button:disabled {
    background-color: rgb(103, 1, 1);
  }

  header h1 {
    display: flex;
    flex: 1;

    justify-content: center;
    align-items: center;

    font-size: x-large;
    font-weight: bold;
  }

  main form {
    display: flex;
    flex-direction: column;

    height: 75vh;

    justify-content: center;
    align-items: center;
  }
</style>
