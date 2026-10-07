import { validateEnvironment } from './environment';

describe('validateEnvironment', () => {
    it('defaults the host to 0.0.0.0 when HOST is unset', () => {
        expect(validateEnvironment({}).HOST).toBe('0.0.0.0');
    });

    it('defaults the host to 0.0.0.0 when HOST is empty', () => {
        expect(validateEnvironment({ HOST: '' }).HOST).toBe('0.0.0.0');
    });

    it.each(['127.0.0.1', '::', '::1', 'localhost', 'api.dndmapp.test'])('accepts "%s" as HOST', (host) => {
        expect(validateEnvironment({ HOST: host }).HOST).toBe(host);
    });

    it.each(['local host', '-localhost', 'localhost-', 'api..test', 'http://localhost', '[::1]', 'a'.repeat(64)])(
        'rejects "%s" as HOST',
        (host) => {
            expect(() => validateEnvironment({ HOST: host })).toThrow('HOST must be a hostname or an IP address');
        },
    );

    it('defaults the port to 3000 when PORT is unset', () => {
        expect(validateEnvironment({}).PORT).toBe(3000);
    });

    it('defaults the port to 3000 when PORT is empty', () => {
        expect(validateEnvironment({ PORT: '' }).PORT).toBe(3000);
    });

    it.each([
        ['1024', 1024],
        ['8080', 8080],
        ['65535', 65535],
    ])('converts "%s" as PORT to a number', (port, expected) => {
        expect(validateEnvironment({ PORT: port }).PORT).toBe(expected);
    });

    it.each(['0', '80', '1023', '65536', '-1', '8080.5', '0x2000', ' 8080', 'eighty'])(
        'rejects "%s" as PORT',
        (port) => {
            expect(() => validateEnvironment({ PORT: port })).toThrow(`PORT must be a whole number from 1024 to 65535`);
        },
    );
});
