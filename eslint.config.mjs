import iqbConfig from '@iqb/eslint-config/compat';

export default [
  ...iqbConfig,
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: import.meta.dirname
      }
    }
  }
];
