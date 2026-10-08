import { isIPv6 } from 'node:net';

// The name that the development certificate covers, from the certificate names in `tools/setup-https.ts`.
const CERTIFICATE_HOSTNAME = 'localhost.content.dndmapp.dev';

// The hosts that listen on every address, which a client cannot connect to by that address.
const WILDCARD_HOSTS = new Set(['0.0.0.0', '::']);

interface ListeningUrlOptions {
    /** The hostname or IP address that the server listens on. */
    host: string;
    /** The port that the server listens on. */
    port: number;
    /** Whether the server serves HTTPS rather than HTTP. */
    https: boolean;
}

/**
 * Returns the URL that a client reaches the server on. A wildcard host becomes the name that the certificate covers
 * over HTTPS, and `localhost` over HTTP. An IPv6 literal goes in brackets, and any other host stays as it is.
 */
export function listeningUrl({ host, port, https }: ListeningUrlOptions) {
    const protocol = https ? 'https' : 'http';
    let hostname = host;

    if (WILDCARD_HOSTS.has(host)) {
        hostname = https ? CERTIFICATE_HOSTNAME : 'localhost';
    } else if (isIPv6(host)) {
        hostname = `[${host}]`;
    }
    return `${protocol}://${hostname}:${port}`;
}
