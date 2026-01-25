module.exports = {
    extends: ['@iqb/eslint-config'],
    parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: __dirname,
    },
    rules: {
        // Add any project-specific overrides here
    },
};
