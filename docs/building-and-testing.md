# Building and testing

## Building

The `build` script compiles the application with the Nest CLI into `dist`. [SWC](https://swc.rs/) transpiles the files, and `tsc` type checks them in parallel, so a type error fails the build without slowing the transpilation down. The `start` script compiles and runs it in watch mode, so it recompiles and restarts as you edit.

## Testing

Tests use Vitest. The specs in `src` test a class through a testing module from `@nestjs/testing` that imports the module of the class, so the module resolves the dependencies the same way it does in the application. An end-to-end suite will follow in a later change. Vitest reads `experimentalDecorators` and `emitDecoratorMetadata` from the TypeScript project, so the decorators of NestJS work without a plugin. Coverage must stay above the thresholds in `vitest.config.ts`.

## Checks

Check and format the repository with these commands. CI runs `format-check`, actionlint, `lint-md`, `lint-ts`, `typecheck`, `build`, and `test-ci`, in that order. Run them yourself before you open a pull request.

```bash
pnpm run format-check
pnpm run format
actionlint
pnpm run lint-md
pnpm run lint-ts
pnpm run typecheck
pnpm run build
pnpm run test-ci
```

The `lint-md` script lints the Markdown files with markdownlint, and the `lint-ts` script lints the code with ESLint. The `typecheck` script checks the three TypeScript projects with `tsc -b`. Use `pnpm test` to run the tests in watch mode with the Vitest UI.
