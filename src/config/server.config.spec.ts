import { serverSchema } from './server.config';

/** Returns the path and message of each issue that the schema reports for the environment. */
function issuesOf(environment: Record<string, string>) {
    return serverSchema.safeParse(environment).error?.issues.map(({ path, message }) => ({ path, message }));
}

describe('serverSchema', () => {
    it('defaults the host to 0.0.0.0 when HOST is unset', () => {
        expect(serverSchema.parse({}).HOST).toBe('0.0.0.0');
    });

    it('defaults the host to 0.0.0.0 when HOST is empty', () => {
        expect(serverSchema.parse({ HOST: '' }).HOST).toBe('0.0.0.0');
    });

    it.each(['127.0.0.1', '::', '::1', 'localhost', 'localhost.', 'api.dndmapp.test'])(
        'accepts "%s" as HOST',
        (host) => {
            expect(serverSchema.parse({ HOST: host }).HOST).toBe(host);
        },
    );

    it.each(['local host', '-localhost', 'localhost-', 'api..test', 'http://localhost', '[::1]', 'a'.repeat(64)])(
        'rejects "%s" as HOST',
        (host) => {
            expect(issuesOf({ HOST: host })).toEqual([
                { path: ['HOST'], message: `must be a hostname or an IP address, but is "${host}".` },
            ]);
        },
    );

    it('defaults the port to 3000 when PORT is unset', () => {
        expect(serverSchema.parse({}).PORT).toBe(3000);
    });

    it('defaults the port to 3000 when PORT is empty', () => {
        expect(serverSchema.parse({ PORT: '' }).PORT).toBe(3000);
    });

    it.each([
        ['1024', 1024],
        ['8080', 8080],
        ['65535', 65535],
    ])('converts "%s" as PORT to a number', (port, expected) => {
        expect(serverSchema.parse({ PORT: port }).PORT).toBe(expected);
    });

    it.each(['0', '80', '1023', '65536', '-1', '8080.5', '0x2000', ' 8080', 'eighty'])(
        'rejects "%s" as PORT',
        (port) => {
            expect(issuesOf({ PORT: port })).toEqual([
                { path: ['PORT'], message: `must be a whole number from 1024 to 65535, but is "${port}".` },
            ]);
        },
    );
});
