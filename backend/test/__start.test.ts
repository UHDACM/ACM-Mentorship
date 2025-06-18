import { it, expect, describe } from 'vitest';
import env from '../src/env/env';

describe('Ensures currently in testing mode', () => {
    it('should be in testing mode', () => {
        // testing requires testing mode, as sockets may try to connect with "bearer testing" token,
        // which is only allowed when testing = true.
        expect(env.TESTING).toBe("true");
    });
});