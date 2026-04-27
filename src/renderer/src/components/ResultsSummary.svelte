<script lang="ts">
  let {
    total,
    complete,
    passed,
    failed,
    errors,
    pending
  }: {
    total: number;
    complete: number;
    passed: number;
    failed: number;
    errors: number;
    pending: number;
  } = $props();

  const items: { label: string; value: number }[] = $derived([
    { label: 'Total', value: total },
    { label: 'Complete', value: complete },
    { label: 'Passed', value: passed },
    { label: 'Failed', value: failed },
    { label: 'Errors', value: errors },
    { label: 'Pending', value: pending }
  ]);
</script>

<section class="summary" aria-label="Grading summary">
  {#each items as item (item.label)}
    <div>
      <span>{item.label}</span>
      <strong>{item.value}</strong>
    </div>
  {/each}
</section>

<style>
  .summary {
    display: grid;
    grid-template-columns: repeat(6, minmax(0, 1fr));
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
