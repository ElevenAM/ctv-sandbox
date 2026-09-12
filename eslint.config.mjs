import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import next from 'eslint-config-next/core-web-vitals'

// eslint-config-next ships flat config from its root export as of Next 16.
export default tseslint.config(
  { ignores: ['.next/**', 'node_modules/**', 'next-env.d.ts'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...next,
  {
    rules: {
      // Rule 4: a failed op returns Result<T>. An unused catch binding is the
      // smell of a swallowed error — name it `_` only when a comment above
      // says why that failure is genuinely uninteresting.
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
  {
    // CLI scripts talk to a human on stdout. `console.log` is the output, not
    // a stray debug statement.
    files: ['scripts/**/*.mjs'],
    rules: { 'no-console': 'off' },
  },
  {
    // Typed linting, scoped to app source only. Running it over config files
    // costs a full program build for no benefit.
    files: ['src/**/*.ts', 'src/**/*.tsx'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': 'error',
      // A floating promise is how "never silent" breaks in practice: the
      // failure resolves into nothing and no state is ever set.
      '@typescript-eslint/no-floating-promises': 'error',
    },
  },
)
