import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { playwright } from '@vitest/browser-playwright';

export default defineConfig({
  test: {
    projects: [
      // Main process tests
      {
        test: {
          include: ['src/main/**/*.test.ts'],
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
          include: ['src/renderer/**/*svelte.test.ts', 'src/renderer/**/*.test.ts'],
          environment: 'jsdom'
        }
      }
    ]
  }
});
