import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const isCI = Boolean(process.env['CI']);

export default defineConfig({
    resolve: {
        // Keep in sync with the `paths` of `tsconfig.app.json`.
        alias: {
            '@/health': fileURLToPath(new URL('./src/health/index.ts', import.meta.url)),
        },
    },
    server: { watch: { ignored: ['**/.vitest/**'] } },
    test: {
        coverage: {
            enabled: true,
            exclude: ['src/main.ts'],
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
        include: ['src/**/*.spec.ts', 'test/**/*.e2e-spec.ts'],
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
