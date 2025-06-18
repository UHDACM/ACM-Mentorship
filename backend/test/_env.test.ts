import { it, expect, describe } from 'vitest';
import env from '../src/env/env';

describe('.env access', () => {
  it('should have env variable access', () => {
    expect(env.SERVER_PORT).toBeTruthy();
  });
});