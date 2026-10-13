import { spawn, spawnSync, type ChildProcess } from 'node:child_process';
import { once } from 'node:events';

// The time that `pnpm run start` gets to compile the application and answer the readiness probe.
const READY_TIMEOUT_MS = 60_000;
const POLL_INTERVAL_MS = 500;
const REQUEST_TIMEOUT_MS = 2_000;

/** A dev server that the suite started, which it stops once the run ends. */
export interface DevServer {
    /** Stops the server and every process that it started. */
    stop(): Promise<void>;
}

/** Returns whether the server at the base URL answers the endpoint with a success status. */
export async function answers(baseUrl: string, path: string) {
    try {
        const response = await fetch(new URL(path, baseUrl), { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });

        return response.ok;
    } catch {
        return false;
    }
}

/**
 * Starts `pnpm run start` through a shell, since `pnpm` is a `.cmd` file on Windows. Outside Windows, the server gets a
 * process group of its own, so a signal to the group reaches the shell, the Nest CLI, and the application it runs. It
 * leaves out the `NODE_ENV=test` of Vitest, with which the server would serve HTTP.
 */
function spawnDevServer() {
    const { NODE_ENV: _nodeEnv, ...env } = process.env;

    return spawn('pnpm run start', {
        detached: process.platform !== 'win32',
        env,
        shell: true,
        stdio: ['ignore', 'pipe', 'pipe'],
    });
}

function hasExited(child: ChildProcess) {
    return child.exitCode !== null || child.signalCode !== null;
}

/**
 * Stops the process and every process that it started, without a dependency such as `tree-kill`. Windows has no
 * process groups, so `taskkill` walks the tree from the process instead.
 */
async function stopProcessTree(child: ChildProcess) {
    const { pid } = child;

    if (pid === undefined || hasExited(child)) {
        return;
    }
    const exited = once(child, 'exit');

    if (process.platform === 'win32') {
        spawnSync('taskkill', ['/pid', String(pid), '/T', '/F'], { stdio: 'ignore' });
    } else {
        process.kill(-pid, 'SIGTERM');
    }
    await exited;
}

/**
 * Starts the dev server and waits until it answers the readiness probe at the base URL. When it is not ready in time,
 * or exits before that, it stops the server and throws with the output of the server.
 */
export async function startDevServer(baseUrl: string): Promise<DevServer> {
    const child = spawnDevServer();
    const output: string[] = [];
    const stop = async () => await stopProcessTree(child);

    child.stdout?.on('data', (chunk: Buffer) => output.push(chunk.toString()));
    child.stderr?.on('data', (chunk: Buffer) => output.push(chunk.toString()));

    const deadline = Date.now() + READY_TIMEOUT_MS;

    while (!(await answers(baseUrl, '/health/ready'))) {
        if (hasExited(child) || Date.now() > deadline) {
            const reason = hasExited(child) ? 'exited' : `is not ready after ${READY_TIMEOUT_MS / 1000} s`;

            await stop();

            throw new Error(`The dev server at ${baseUrl} ${reason}. Its output:\n\n${output.join('')}`);
        }
        await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
    }
    return { stop };
}
