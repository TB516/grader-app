<script lang="ts">
  import type { GraderRun, GraderResult } from '../../../shared/types';

  let { graders }: { graders: GraderRun[] } = $props();
  const counts = $derived.by(() => {
    const statuses: Record<GraderResult['status'] | 'pending', number> = { pass: 0, fail: 0, error: 0, cancelled: 0, pending: 0 };
    for (const grader of graders) statuses[grader.result?.status ?? 'pending'] += 1;
    return statuses;
  });
</script>

<section class="summary" aria-label="Grading summary">
  <div>
    <span>Total</span>
    <strong>{graders.length}</strong>
  </div>
  <div>
    <span>Complete</span>
    <strong>{graders.length - counts.pending - counts.cancelled}</strong>
  </div>
  <div>
    <span>Passed</span>
    <strong>{counts.pass}</strong>
  </div>
  <div>
    <span>Failed</span>
    <strong>{counts.fail}</strong>
  </div>
  <div>
    <span>Errors</span>
    <strong>{counts.error}</strong>
  </div>
  <div>
    <span>Pending</span>
    <strong>{counts.pending}</strong>
  </div>
  {#if counts.cancelled > 0}
    <div><span>Cancelled</span><strong>{counts.cancelled}</strong></div>
  {/if}
</section>

<style>
  .summary {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(90px, 1fr));
    gap: 10px;
    position: sticky;
    top: 0;
    z-index: 1;
    margin-bottom: 18px;
    padding: 12px 0;
    background: rgb(8 9 11 / 92%);
    backdrop-filter: blur(12px);
  }

  .summary div {
    padding: 12px 0;
  }

  .summary span {
    display: block;
    color: #717a75;
    font-size: 0.76rem;
    font-weight: 650;
    text-transform: uppercase;
  }

  .summary strong {
    display: block;
    margin-top: 6px;
    color: #f3f4ef;
    font-size: 2rem;
    font-weight: 680;
    line-height: 1;
  }

  @media (max-width: 760px) {
    .summary {
      position: static;
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }

    .summary div {
      padding-bottom: 8px;
    }
  }
</style>
