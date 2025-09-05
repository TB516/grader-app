<script lang="ts">
  import projects from '../../../../resources/projects.json';

  let projectUrl: string;
  let selectedProject: string;

  const startTests = (): void => {
    window.api.launchTester(selectedProject, projectUrl);
  };
</script>

<main>
  <form>
    <input type="search" placeholder="Project URL" bind:value={projectUrl} />

    <select bind:value={selectedProject}>
      {#each projects as project, i (i)}
        <option>{project}</option>
      {/each}
    </select>

    <button onclick={startTests}>Test Project</button>
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
