<script lang="ts">
  import projects from '../../../../resources/projects.json';

  let testing = false;
  let projectUrl: string;
  let selectedProject: string;

  const testProject = (): void => {};
</script>

<main>
  <input type="search" placeholder="Project URL" bind:value={projectUrl} />

  <select bind:value={selectedProject}>
    {#each projects as project, i (i)}
      <option>{project}</option>
    {/each}
  </select>

  <button onclick={testProject} disabled={testing}>Test Project</button>
</main>

<style>
</style>
