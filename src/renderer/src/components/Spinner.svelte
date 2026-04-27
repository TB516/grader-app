<script lang="ts">
  export let ariaLabel = 'Loading';
</script>

<span class="spinner" role="status" aria-label={ariaLabel}></span>

<style>
  .spinner {
    display: inline-block;
    width: 16px;
    height: 16px;
    border: 2px solid #374151;
    border-top-color: #d1d5db;
    border-radius: 999px;
    animation: spin 800ms linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .spinner {
      animation: none;
    }
  }
</style>
