<script lang="ts">
  import projects from '../../../../resources/projects.json';

  let testing = false;
  let projectUrl: string;
  let selectedProject: string;

  const testProject = (): void => {};
</script>

<main>
  <form>
    <input type="search" placeholder="Project URL" bind:value={projectUrl} />

    <select bind:value={selectedProject}>
      {#each projects as project, i (i)}
        <option>{project}</option>
      {/each}
    </select>

    <button onclick={testProject} disabled={testing}>Test Project</button>
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
