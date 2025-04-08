import eslint from '@eslint/js';
import importPlugin from 'eslint-plugin-import';

import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['eslint.config.mjs'],
  },
  eslint.configs.recommended,
  importPlugin.flatConfigs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  eslintPluginPrettierRecommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      ecmaVersion: 5,
      sourceType: 'module',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    settings: {
      'import/extensions': ['.js', '.ts'],
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
        },
      },
    },
  },
  {
    rules: {
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      'no-console': 'error',
      'import/newline-after-import': ['error', { count: 1 }],
      'import/order': [
        'error',
        {
          groups: ['type', ['builtin', 'external'], 'parent', 'sibling', 'index'],
          alphabetize: {
            order: 'asc',
          },
          'newlines-between': 'always',
        },
      ],
      '@typescript-eslint/array-type': 'error',
      'no-use-before-define': 'off',
      '@typescript-eslint/no-use-before-define': 'error',
      'array-callback-return': 'error',
      curly: 'error',
      'default-case': 'error',
      'default-case-last': 'error',
      'default-param-last': 'error',
      'no-invalid-this': 'error',
      'no-return-assign': 'error',
      'no-unused-expressions': ['error', { allowTernary: true }],
      'no-useless-concat': 'error',
      'no-useless-return': 'error',
      'guard-for-in': 'error',
      'no-case-declarations': 'error',
      'no-implicit-coercion': 'error',
      'no-lone-blocks': 'error',
      'no-loop-func': 'error',
      'no-param-reassign': 'error',
      'no-return-await': 'error',
      'no-self-compare': 'error',
      'no-throw-literal': 'error',
      'no-useless-catch': 'error',
      'prefer-promise-reject-errors': 'error',
      yoda: ['error', 'always'],
      'arrow-body-style': ['warn', 'as-needed'],
      'no-useless-rename': 'error',
      'prefer-destructuring': [
        'error',
        {
          array: true,
          object: true,
        },
        {
          enforceForRenamedProperties: false,
        },
      ],
      'prefer-numeric-literals': 'error',
      'prefer-rest-params': 'warn',
      'prefer-spread': 'error',
      'array-bracket-newline': ['error', { multiline: true, minItems: null }],
      'array-bracket-spacing': 'error',
      'brace-style': ['error', '1tbs', { allowSingleLine: true }],
      'block-spacing': 'error',
      'comma-spacing': 'error',
      'comma-style': 'error',
      'computed-property-spacing': 'error',
      'func-call-spacing': 'error',
      'implicit-arrow-linebreak': ['error', 'beside'],
      'keyword-spacing': 'error',
      'multiline-ternary': ['error', 'always-multiline'],
      'no-mixed-operators': 'error',
      'no-multiple-empty-lines': ['error', { max: 2, maxEOF: 1 }],
      'no-tabs': 'error',
      'no-unneeded-ternary': 'error',
      'no-whitespace-before-property': 'error',
      'nonblock-statement-body-position': ['error', 'below'],
      'object-property-newline': ['error', { allowAllPropertiesOnSameLine: true }],
      'space-before-blocks': 'error',
      'space-in-parens': 'error',
      'space-infix-ops': 'error',
      'space-unary-ops': 'error',
      'arrow-spacing': 'error',
      'no-confusing-arrow': 'off',
      'no-var': 'error',
      'object-shorthand': 'error',
      'prefer-const': 'error',
      'prefer-template': 'error',
      quotes: ['warn', 'single', { allowTemplateLiterals: true }],
    },
  },
);
