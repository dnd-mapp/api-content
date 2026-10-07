import { defineConfig } from 'vitest/config';

const isCI = Boolean(process.env['CI']);

export default defineConfig({
    // Resolve the path aliases from the `paths` of `tsconfig.json`.
    resolve: { tsconfigPaths: true },
    server: { watch: { ignored: ['**/.vitest/**'] } },
    test: {
        coverage: {
            enabled: true,
            // The entry point and the root module only wire the application together, which the end-to-end suite
            // will cover once it exists. The barrel files only re-export what each module shares.
            exclude: ['src/main.ts', 'src/app.module.ts', 'src/**/index.ts'],
            include: ['src/**/*.ts'],
            provider: 'v8',
            reporter: ['text-summary', 'html'],
            reportOnFailure: true,
            reportsDirectory: '.coverage',
            // No branch threshold: the metadata that the decorator transform emits for every injected constructor
            // parameter contains a fallback branch that no test can reach, which would fail any branch threshold.
            thresholds: {
                functions: 80,
                lines: 80,
                statements: 80,
            },
        },
        environment: 'node',
        globals: true,
        include: ['src/**/*.spec.ts'],
        mockReset: true,
        name: 'api-content',
        open: false,
        passWithNoTests: true,
        reporters: ['dot', 'html', ...(isCI ? ['github-actions'] : [])],
        sequence: {
            shuffle: true,
        },
    },
});
