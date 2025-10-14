import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import vitestPlugin from 'eslint-plugin-vitest';

const tsFlatRecommended = tsPlugin.configs['flat/recommended'];

export default [
  {
    ignores: ['node_modules/', 'dist/', 'coverage/', '.wrangler/']
  },
  js.configs.recommended,
  ...tsFlatRecommended,
  {
    files: ['**/*.ts'],
    languageOptions: {
      parserOptions: {
        sourceType: 'module'
      }
    },
    rules: {
      '@typescript-eslint/explicit-function-return-type': [
        'error',
        {
          allowExpressions: true,
          allowHigherOrderFunctions: true
        }
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/require-await': 'off'
    }
  },
  {
    files: ['tests/**/*.ts'],
    plugins: {
      vitest: vitestPlugin
    },
    languageOptions: {
      globals: {
        ...vitestPlugin.environments.env.globals
      }
    },
    rules: {
      ...vitestPlugin.configs.recommended.rules
    }
  }
];
