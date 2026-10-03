/**
 * @type {import('lint-staged').Configuration}
 */
export default {
  '*.{yaml,yml,json}': 'prettier --write',
  '*.{js,mjs,cjs,ts,svelte}': ['eslint --fix --cache', 'prettier --write']
};
