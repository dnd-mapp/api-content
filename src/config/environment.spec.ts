import { environmentSchema } from './environment';

describe('environmentSchema', () => {
    it('reports every invalid variable together, each under its name', () => {
        const issues = environmentSchema.safeParse({ HOST: 'local host', PORT: '80' }).error?.issues;

        expect(issues?.map(({ path }) => path)).toEqual([['HOST'], ['PORT']]);
    });
});
