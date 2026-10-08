import type * as fs from 'node:fs';

/** The contents of the files that `readFileSync` reads, by path. */
const files = new Map<string, string>();

// Each test starts without files, like a fresh working directory.
afterEach(() => {
    files.clear();
});

/** Adds a file that `readFileSync` reads from now on, until the test ends. */
export function givenFile(path: string, contents: string) {
    files.set(path, contents);
}

/** Throws the error that Node.js throws for a missing file. */
function notFound(path: fs.PathOrFileDescriptor): never {
    throw Object.assign(new Error(`ENOENT: no such file or directory, open '${String(path)}'`), {
        code: 'ENOENT',
        errno: -2,
        path: String(path),
        syscall: 'open',
    });
}

function readFile(
    path: fs.PathOrFileDescriptor,
    options?: BufferEncoding | { encoding?: BufferEncoding | null } | null,
) {
    const contents = files.get(String(path)) ?? notFound(path);
    const encoding = typeof options === 'string' ? options : options?.encoding;

    return encoding ? contents : Buffer.from(contents);
}

/**
 * The `node:fs` module that `vi.mock('node:fs')` puts in place, through `__mocks__/fs.ts`. It holds only the functions
 * below, so a spec that mocks `node:fs` never touches the real file system. Add a function here once the code under
 * test calls it.
 */
export const readFileSync = vi.fn(readFile as typeof fs.readFileSync);
