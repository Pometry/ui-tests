module.exports = {
    env: { browser: true, es2020: true, node: true }, // node here is for this file, as ESLint does not support ESM configuration yet
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:react/recommended',
        'plugin:react-hooks/recommended',
        'plugin:import/recommended',
        'plugin:import/typescript',
        'plugin:yml/prettier',
    ],
    settings: {
        typescript: true,
        'import/resolver': {
            typescript: true,
            node: true,
        },
        react: {
            version: 'detect',
        },
    },
    parser: '@typescript-eslint/parser',
    parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
    },
    plugins: ['react-refresh', 'import', 'unused-imports'],
    rules: {
        'react-refresh/only-export-components': 'warn',
        'import/no-empty-named-blocks': 'error',
        'import/order': [
            'error',
            {
                groups: [
                    ['builtin', 'external', 'object', 'type'],
                    ['internal', 'parent', 'sibling', 'index'],
                ],
                alphabetize: {
                    order: 'asc',
                    caseInsensitive: true,
                },
            },
        ],
        'sort-imports': [
            'error',
            {
                allowSeparatedGroups: true,
                ignoreCase: true,
                ignoreDeclarationSort: true,
                ignoreMemberSort: false,
                memberSyntaxSortOrder: ['none', 'all', 'multiple', 'single'],
            },
        ],
        '@typescript-eslint/no-unused-vars': 'off',
        '@typescript-eslint/no-explicit-any': 'error',
        'unused-imports/no-unused-imports': 'error',
        'unused-imports/no-unused-vars': [
            'warn',
            {
                vars: 'all',
                varsIgnorePattern: '^_',
                args: 'after-used',
                argsIgnorePattern: '^_',
            },
        ],
        'import/no-duplicates': ['error', { considerQueryString: true }],
        'import/no-unresolved': ['error', { ignore: ['^~icons/'] }],
        'react/react-in-jsx-scope': 'off',
        'react/jsx-key': 'error',
        'react/no-array-index-key': 'warn',
    },
    ignorePatterns: ['lib/api/__generated/**/*'],
    overrides: [
        {
            files: ['*.yaml', '*.yml'],
            parser: 'yaml-eslint-parser',
        },
    ],
};
