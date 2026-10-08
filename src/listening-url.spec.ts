import { listeningUrl } from './listening-url';

describe('listeningUrl', () => {
    it.each([
        ['0.0.0.0', true, 'https://localhost.content.dndmapp.dev:3000'],
        ['::', true, 'https://localhost.content.dndmapp.dev:3000'],
        ['0.0.0.0', false, 'http://localhost:3000'],
        ['::', false, 'http://localhost:3000'],
    ])('turns the wildcard host "%s" with https %s into %s', (host, https, expected) => {
        expect(listeningUrl({ host, port: 3000, https })).toBe(expected);
    });

    it('puts an IPv6 literal in brackets', () => {
        expect(listeningUrl({ host: '::1', port: 3000, https: false })).toBe('http://[::1]:3000');
    });

    it.each([
        ['127.0.0.1', 'https://127.0.0.1:3000'],
        ['api.dndmapp.test', 'https://api.dndmapp.test:3000'],
    ])('keeps the host "%s" as it is', (host, expected) => {
        expect(listeningUrl({ host, port: 3000, https: true })).toBe(expected);
    });

    it('uses the configured port', () => {
        expect(listeningUrl({ host: '0.0.0.0', port: 8080, https: false })).toBe('http://localhost:8080');
    });
});
