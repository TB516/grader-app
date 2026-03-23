/**
 * @filename: lint-staged.config.js
 * @type {import('lint-staged').Configuration}
 */
export default {
  '*{.yaml|yml|.json}': 'prettier --write',
  '*{.ts|.svelte}': ['eslint --fix --cached', 'prettier --write']
};
