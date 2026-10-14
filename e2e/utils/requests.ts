import { inject } from 'vitest';

const baseUrl = inject('baseUrl');

/** Sends a GET request for the path to the server of the suite. */
export async function get(path: string, init?: RequestInit) {
    return await fetch(new URL(path, baseUrl), init);
}

/** Sends the preflight that a browser sends before a request of the method from a page of the origin. */
export async function preflight(path: string, origin: string, method = 'GET') {
    return await fetch(new URL(path, baseUrl), {
        method: 'OPTIONS',
        headers: { origin, 'access-control-request-method': method },
    });
}

/** Returns the header names in the `Vary` header of the response, in lower case. */
export function varyOf(response: Response) {
    return (response.headers.get('vary') ?? '').split(',').map((name) => name.trim().toLowerCase());
}
