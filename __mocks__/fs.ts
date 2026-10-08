// Vitest looks up the mock of a Node.js built-in only in the `__mocks__` folder at the root, so `vi.mock('node:fs')`
// loads this file, which forwards to the mock in `testing/`.
export * from '../testing/mocks/fs';
