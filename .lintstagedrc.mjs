const config = {
    '!(**/__generated/**/*)*.{ts,tsx,graphql}': () => ['pnpm run tsc'],
    '!(**/__generated/**/*)!(**/types/**/*)*.{ts,tsx,graphql,cjs,mjs,js,jsx,json,yaml,yml}':
        ['pnpm run eslint', 'pnpm run format'],
    '!(**/__generated/**/*)*.css': (filenames) => [
        `pnpm run format ${filenames}`,
    ],
    '!(**/__generated/**/*)*.html': ['pnpm run format'],
};
export default config;
