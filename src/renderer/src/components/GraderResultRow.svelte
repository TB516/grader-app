<script lang="ts">
  import type { GraderRun } from '../../../shared/types';
  import DetailsDisclosure from './DetailsDisclosure.svelte';
  import Spinner from './Spinner.svelte';
  import StatusBadge from './StatusBadge.svelte';

  let { grader }: { grader: GraderRun } = $props();
</script>

<li class={grader.result?.status ?? 'pending'}>
  <div class="grader-heading">
    <h2>{grader.label}</h2>
    <StatusBadge status={grader.result?.status ?? 'pending'} />
  </div>

  {#if grader.result}
    <div>
      <p>{grader.result.message}</p>

      {#if grader.result.details && grader.result.status !== 'pass'}
        <DetailsDisclosure details={grader.result.details} />
      {/if}
    </div>
  {:else}
    <p class="pending-message">
      <Spinner ariaLabel="Waiting for grader result" />
      Waiting for result
    </p>
  {/if}
</li>

<style>
  li {
    display: grid;
    grid-template-columns: minmax(220px, 0.8fr) minmax(0, 1.2fr);
    gap: 22px;
    padding: 20px 0;
    border-bottom: 1px solid #1b2023;
  }

  .pass {
    border-left: 3px solid #22c55e;
    padding-left: 16px;
  }

  .fail {
    border-left: 3px solid #ef4444;
    padding-left: 16px;
  }

  .error {
    border-left: 3px solid #facc15;
    padding-left: 16px;
  }

  .pending {
    border-left: 3px solid #6b7280;
    padding-left: 16px;
  }

  .grader-heading {
    display: flex;
    gap: 16px;
    align-items: flex-start;
    justify-content: space-between;
  }

  h2 {
    margin: 0;
    color: #f3f4ef;
    font-size: 1.05rem;
    font-weight: 680;
    line-height: 1.35;
  }

  p {
    margin: 0;
    color: #aeb8b1;
    line-height: 1.5;
  }

  .pending-message {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  @media (max-width: 760px) {
    li {
      grid-template-columns: 1fr;
      gap: 12px;
    }
  }
</style>
