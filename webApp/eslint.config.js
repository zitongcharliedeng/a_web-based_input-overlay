import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['**/*.js', 'dist/**', 'node_modules/**', '**/_compiled/**']
  },
  ...tseslint.configs.strictTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname
      }
    },
    rules: {
      // BLOCK: No 'any' type allowed
      '@typescript-eslint/no-explicit-any': 'error',

      // BLOCK: No type assertions (as, <>, !)
      '@typescript-eslint/consistent-type-assertions': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',

      // Error on unused variables
      '@typescript-eslint/no-unused-vars': 'error',

      // TODO: Re-enable after green light (183 violations to fix)
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unnecessary-boolean-literal-compare': 'off',
      '@typescript-eslint/no-unnecessary-condition': 'off',
      '@typescript-eslint/restrict-plus-operands': 'off',
      '@typescript-eslint/restrict-template-expressions': 'off',
    }
  }
);
