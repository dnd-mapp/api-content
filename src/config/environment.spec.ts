import { validateEnvironment } from './environment';

describe('validateEnvironment', () => {
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
