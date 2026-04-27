<script lang="ts">
  let { details }: { details: string } = $props();
</script>

<details>
  <summary>Details</summary>
  <pre>{details}</pre>
</details>

<style>
  details {
    margin-top: 12px;
  }

  summary {
    width: fit-content;
    color: #dce3dd;
    font-size: 0.9rem;
    font-weight: 700;
    cursor: pointer;
  }

  summary::marker {
    color: #7f8782;
  }

  pre {
    overflow-x: auto;
    margin: 12px 0 0;
    border-left: 1px solid #323a36;
    padding: 4px 0 4px 14px;
    color: #dce3dd;
    white-space: pre-wrap;
    line-height: 1.45;
  }
</style>
