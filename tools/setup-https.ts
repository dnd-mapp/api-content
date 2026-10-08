import { spawnSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';

// The server reads these files by default, relative to the working directory, which pnpm sets to the repository root.
const CERTS_DIRECTORY = '.certs';
const CERT_FILE = `${CERTS_DIRECTORY}/cert.pem`;
const KEY_FILE = `${CERTS_DIRECTORY}/key.pem`;
// The certificate leaves out `::1`, since the default `HOST` of `0.0.0.0` only listens on IPv4.
const NAMES = ['localhost.content.dndmapp.dev', 'localhost', '127.0.0.1'];

const GUIDE = 'docs/local-https.md';

if (spawnSync('mkcert', ['-help'], { stdio: 'ignore' }).error !== undefined) {
    console.error(`mkcert is not on PATH. Install it and trust its CA as ${GUIDE} describes, then run this again.`);
    process.exit(1);
}

// mkcert does not create a missing folder.
mkdirSync(CERTS_DIRECTORY, { recursive: true });

const { status } = spawnSync('mkcert', ['-cert-file', CERT_FILE, '-key-file', KEY_FILE, ...NAMES], {
    stdio: 'inherit',
});

process.exitCode = status ?? 1;
