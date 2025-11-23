// ESLint flat config (v9+) - lints both WebApp and DesktopWrappedWebapp
module.exports = [
  {
    files: ['**/*.ts'],
    ignores: ['**/*.d.ts', '**/node_modules/**', '**/_bundleAllCompiledJavascriptForWebapp/**'],
    languageOptions: {
      parser: require('@typescript-eslint/parser'),
      parserOptions: {
        sourceType: 'module'
      }
    },
    plugins: {
      '@typescript-eslint': require('@typescript-eslint/eslint-plugin')
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-non-null-assertion': 'warn'
    }
  }
];
