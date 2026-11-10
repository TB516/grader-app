<script lang="ts">
  import { assignmentNames, type AssignmentName } from '../../../shared/assignments';

  let assignment = $state<AssignmentName>(assignmentNames[0]);
  let address = $state('');
  let errorMessage = $state<string>();

  /** Lets an address be pasted without its scheme. Local servers are plain HTTP. */
  const withScheme = (input: string) => {
    if (input.includes('://')) return input;
    if (/^(localhost|127\.0\.0\.1)\b/.test(input)) return `http://${input}`;
    return `https://${input}`;
  };

  const grade = async (event: SubmitEvent) => {
    event.preventDefault();
    errorMessage = await window.api.openResults(assignment, withScheme(address.trim()));

    // Ready for the next student's address. Re-grading the same site is "Run again" in its window.
    if (!errorMessage) address = '';
  };
</script>

<form onsubmit={grade}>
  <label class="field">
    Assignment
    <select bind:value={assignment}>
      {#each assignmentNames as name (name)}
        <option value={name}>{name}</option>
      {/each}
    </select>
  </label>

  <div class="field">
    <label for="address">Site address</label>
    <div class="address">
      <input
        id="address"
        type="text"
        inputmode="url"
        autocomplete="off"
        spellcheck="false"
        placeholder="student-site.onrender.com"
        required
        aria-invalid={errorMessage ? 'true' : undefined}
        aria-describedby={errorMessage ? 'address-error' : undefined}
        bind:value={address}
        oninput={() => (errorMessage = undefined)}
      />
      <button type="submit" class="primary">Grade</button>
    </div>

    {#if errorMessage}
      <p id="address-error" class="error">{errorMessage}</p>
    {/if}
  </div>
</form>

<style>
  form {
    display: grid;
    gap: 1.25rem;
    padding: 1.5rem;
  }

  .field {
    display: grid;
    gap: 0.375rem;
    color: var(--muted);
    font-size: 0.875rem;
    font-weight: 600;
  }

  /* Styles the closed select to match the input. The open list stays native so it can extend
     past this small window. */
  select {
    appearance: base-select;
  }

  select::picker-icon {
    color: var(--muted);
  }

  select,
  input {
    width: 100%;
    color: var(--text);
    font-size: 1rem;
    font-weight: 400;
  }

  .address {
    display: flex;
    gap: 0.5rem;
  }

  .address input {
    flex: 1;
    min-width: 0;
    padding-block: 0.5625rem;
  }

  .address button {
    padding-inline: 1.5rem;
    font-size: 1rem;
  }

  .error {
    color: var(--failed);
    font-weight: 400;
  }
</style>
