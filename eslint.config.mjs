import eslintConfigPrettier from '@electron-toolkit/eslint-config-prettier';
import tseslint from '@electron-toolkit/eslint-config-ts';
import { defineConfig } from 'eslint/config';
import { importX } from 'eslint-plugin-import-x';
import eslintPluginSvelte from 'eslint-plugin-svelte';

export default defineConfig(
  { ignores: ['**/node_modules', '**/dist', '**/out'] },
  tseslint.configs.recommended,
  eslintPluginSvelte.configs['flat/recommended'],
  importX.flatConfigs.recommended,
  importX.flatConfigs.typescript,
  {
    files: ['**/*.svelte'],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser
      }
    }
  },
  {
    rules: {
      '@typescript-eslint/explicit-function-return-type': 'off',
      'import-x/order': ['error', { alphabetize: { order: 'asc', caseInsensitive: true } }]
    }
  },
  eslintConfigPrettier
);
