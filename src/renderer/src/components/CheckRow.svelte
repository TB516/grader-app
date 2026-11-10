<script lang="ts">
  import type { CheckResult } from '../../../shared/grading';

  type Props = { label: string; result: CheckResult | undefined; cancelled: boolean };
  let { label, result, cancelled }: Props = $props();

  const status = $derived(result?.status ?? (cancelled ? 'cancelled' : 'running'));

  const statusNames = {
    passed: 'Passed',
    failed: 'Failed',
    error: 'Error',
    cancelled: 'Cancelled',
    running: 'Checking'
  };
</script>

<li class={status}>
  <span class="status">{statusNames[status]}</span>

  <div>
    <p class="label">{label}</p>
    {#if result}
      <p class="message">{result.message}</p>
    {/if}
    {#if result?.details}
      <details>
        <summary>Details</summary>
        <pre>{result.details}</pre>
      </details>
    {/if}
  </div>
</li>

<style>
  li {
    display: grid;
    grid-template-columns: 5.5rem 1fr;
    gap: 1rem;
    align-items: baseline;
    padding: 0.875rem 1.25rem;
  }

  .status {
    justify-self: start;
    padding: 0.0625rem 0.5rem;
    border-radius: 4px;
    color: var(--muted);
    background: var(--neutral-tint);
    font-size: 0.8125rem;
    font-weight: 650;
  }

  .passed .status {
    color: var(--passed);
    background: var(--passed-tint);
  }

  .failed .status {
    color: var(--failed);
    background: var(--failed-tint);
  }

  .error .status {
    color: var(--error);
    background: var(--error-tint);
  }

  .label {
    font-weight: 600;
  }

  .message {
    color: var(--muted);
  }

  .failed .message {
    color: var(--failed);
  }

  .error .message {
    color: var(--error);
  }

  summary {
    width: fit-content;
    margin-top: 0.25rem;
    color: var(--muted);
    font-size: 0.875rem;
    cursor: pointer;
  }

  pre {
    margin-top: 0.5rem;
    padding: 0.625rem 0.875rem;
    border: 1px solid var(--border);
    border-radius: 6px;
    background: var(--background);
    font-size: 0.8125rem;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
  }
</style>
