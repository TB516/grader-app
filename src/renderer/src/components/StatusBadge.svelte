<script module lang="ts">
  export type StatusBadgeStatus = 'pass' | 'fail' | 'error' | 'pending';
</script>

<script lang="ts">
  let { status }: { status: StatusBadgeStatus } = $props();
</script>

<span class={status}>{status}</span>

<style>
  span {
    flex: 0 0 auto;
    min-width: 76px;
    padding: 5px 10px;
    border-radius: 999px;
    color: #aeb8b1;
    background: #111417;
    text-align: center;
    text-transform: capitalize;
    font-size: 0.78rem;
    font-weight: 700;
  }

  .pass {
    color: #06130a;
    background: #22c55e;
  }

  .fail {
    color: #fff1f2;
    background: #991b1b;
  }

  .error {
    color: #1c1400;
    background: #facc15;
  }

  .pending {
    color: #e5e7eb;
    background: #374151;
  }
</style>
