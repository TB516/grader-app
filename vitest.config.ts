import { svelte } from '@sveltejs/vite-plugin-svelte';
import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: [
      // Main process tests
      {
        test: {
          include: ['tests/main/**/*.test.ts'],
          environment: 'node'
        }
      },
      // Renderer process tests
      {
        plugins: [svelte()],
        test: {
          browser: {
            enabled: true,
            provider: playwright(),
            instances: [{ browser: 'chromium', headless: true }]
          },
          include: ['tests/renderer/**/*svelte.test.ts', 'tests/renderer/**/*.test.ts'],
          environment: 'jsdom'
        }
      }
    ]
  }
});
