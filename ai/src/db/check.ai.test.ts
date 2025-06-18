import { describe, it, expect, beforeAll } from 'vitest';
import { CheckUserBelowAIResumeQuota, UsersOnAIResumeTimeout } from './check';
import { DBDeleteWithID, DBSetWithID } from './db';
import { Metric } from '@shared/types/metric';
import env from '../env/env';

const testUserID = 'ai.check.test-DVjEI3';
const testUser2ID = 'ai.check.test-VHSio4';

const AIRequestLimits = env.AI_LIMITS.requestsMadeLastHour;
const AITokenLimits = env.AI_LIMITS.tokensUsedLastHour;

const BelowQuotaMetrics: Metric[] = [
  // definitely below quota
  {
    AIResume: {
      tokensUsedLastHour: {
        count: 0,
        timestamp: Date.now()
      },
      requestsMadeLastHour: {
        count: 0,
        timestamp: Date.now()
      }
    }
  },

  // just below quota (both)
  {
    AIResume: {
      tokensUsedLastHour: {
        count: AITokenLimits - 1,
        timestamp: Date.now()
      },
      requestsMadeLastHour: {
        count: AIRequestLimits - 1,
        timestamp: Date.now()
      }
    }
  },

  // just below quota (tokens)
  {
    AIResume: {
      tokensUsedLastHour: {
        count: AITokenLimits - 1,
        timestamp: Date.now()
      },
      requestsMadeLastHour: {
        count: 0,
        timestamp: Date.now()
      }
    }
  },

  // just below quota (requests)
  {
    AIResume: {
      tokensUsedLastHour: {
        count: 0,
        timestamp: Date.now()
      },
      requestsMadeLastHour: {
        count: AIRequestLimits - 1,
        timestamp: Date.now()
      }
    }
  }
];

const FO_SHO_Multiplier = 10;
const AboveQuotaMetrics: Metric[] = [
  // definitely above quota
  {
    AIResume: {
      tokensUsedLastHour: {
        count: AITokenLimits * FO_SHO_Multiplier,
        timestamp: Date.now()
      },
      requestsMadeLastHour: {
        count: AIRequestLimits * FO_SHO_Multiplier,
        timestamp: Date.now()
      }
    }
  },

  // just above quota (both)
  {
    AIResume: {
      tokensUsedLastHour: {
        count: AITokenLimits + 1,
        timestamp: Date.now()
      },
      requestsMadeLastHour: {
        count: AIRequestLimits + 1,
        timestamp: Date.now()
      }
    }
  },
  
  // just above quota (tokens)
  {
    AIResume: {
      tokensUsedLastHour: {
        count: AITokenLimits + 1,
        timestamp: Date.now()
      },
      requestsMadeLastHour: {
        count: 0,
        timestamp: Date.now()
      }
    }
  },
  
  // just above quota (requests)
  {
    AIResume: {
      tokensUsedLastHour: {
        count: 0,
        timestamp: Date.now()
      },
      requestsMadeLastHour: {
        count: AIRequestLimits + 1,
        timestamp: Date.now()
      }
    }
  },
  
  // right at quota (tokens)
  {
    AIResume: {
      tokensUsedLastHour: {
        count: AITokenLimits,
        timestamp: Date.now()
      },
      requestsMadeLastHour: {
        count: 0,
        timestamp: Date.now()
      }
    }
  },
  
  // right at quota (requests)
  {
    AIResume: {
      tokensUsedLastHour: {
        count: 0,
        timestamp: Date.now()
      },
      requestsMadeLastHour: {
        count: AIRequestLimits,
        timestamp: Date.now()
      }
    }
  },

  // right at quota (both)
  {
    AIResume: {
      tokensUsedLastHour: {
        count: AITokenLimits,
        timestamp: Date.now()
      },
      requestsMadeLastHour: {
        count: AIRequestLimits,
        timestamp: Date.now()
      }
    }
  }
];

beforeAll(async () => {
  // ensure test user metric is cleaned before tests
  const res = await DBDeleteWithID('metrics', testUserID);
  expect(res).toBe(true);
})

describe('CheckUserBelowAIResumeQuota', () => {
  // test user should be below quota initially, as no metrics exist
  it('Should return true for user with no metrics', async () => {
    // runs multiple times to ensure consistent behavior
    for (let i = 0; i < 3; i++) {
      const res = await CheckUserBelowAIResumeQuota(testUserID);
      expect(res).toBe(true);
    }
  });

  it('Should return true for user with metrics below quota', async () => {
    for (const metric of BelowQuotaMetrics) {
      await DBSetWithID('metrics', testUserID, metric);
      const res = await CheckUserBelowAIResumeQuota(testUserID);
      if (!res) {
        // for debugging
        console.log('Failed metric, expected true:', metric);
      }
      expect(res).toBe(true);
    }
  });

  it('Should return false for user with metrics above quota', async () => {
    for (const metric of AboveQuotaMetrics) {
      await DBSetWithID('metrics', testUserID, metric);
      const res = await CheckUserBelowAIResumeQuota(testUserID);
      if (res) {
        // for debugging
        console.log('Failed metric, expected false:', metric);
      }
      expect(res).toBe(false);
    }
  });

  it('Should return false for user on timeout cache', async () => {
    // after previous test, user should be on timeout cache, regardless of metrics
    await DBSetWithID('metrics', testUserID, BelowQuotaMetrics[0]);
    const res = await CheckUserBelowAIResumeQuota(testUserID);
    expect(res).toBe(false);
  });

  it('Should return true for user after timeout expires', async () => {
    // manually expire timeout
    UsersOnAIResumeTimeout.set(testUserID, { timeoutEnd: Date.now() - 1000 });

    // set metrics to below quota
    await DBSetWithID('metrics', testUserID, BelowQuotaMetrics[0]);

    // user should now be below quota, as metrics are below quota, and timeout has expired
    const res = await CheckUserBelowAIResumeQuota(testUserID);
    expect(res).toBe(true);
  });
});

const Timeout_Difference_Allowance_MS = 5000; // how close the timeout end time should be to the next hour (in ms)
describe('UsersOnAIResumeTimeout cache behavior', () => {
  it('Should add a user to timeout cache with timeout ending at next hour', async () => {
    const res = await DBSetWithID('metrics', testUser2ID, AboveQuotaMetrics[0]);
    expect(res).toBe(true);

    const now = new Date();
    const checkRes = await CheckUserBelowAIResumeQuota(testUser2ID);
    expect(checkRes).toBe(false);

    const timeoutInfo = UsersOnAIResumeTimeout.get(testUser2ID);
    
    if (!timeoutInfo) {
      throw new Error('User not found in timeout cache after exceeding quota');
    }

    const nextHour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours() + 1, 0, 0, 0);
    const diff = Math.abs(timeoutInfo.timeoutEnd - nextHour.getTime());

    // allow up to 5 seconds of difference for test execution time
    expect(diff).toBeLessThan(Timeout_Difference_Allowance_MS);
  });

  it('Should remove user from timeout cache after timeout expires', async () => {
    // set metrics to below quota
    await DBSetWithID('metrics', testUser2ID, BelowQuotaMetrics[0]);

    // even though metrics are below quota, user should still be on timeout
    const res = await CheckUserBelowAIResumeQuota(testUser2ID);
    expect(res).toBe(false);

    // manually expire timeout
    UsersOnAIResumeTimeout.set(testUser2ID, { timeoutEnd: Date.now() - 1000 });


    // user should now be below quota, as metrics are below quota, and timeout has expired
    const res2 = await CheckUserBelowAIResumeQuota(testUser2ID);
    expect(res2).toBe(true);

    // user should be removed from timeout cache
    const timeoutInfo = UsersOnAIResumeTimeout.get(testUser2ID);
    expect(timeoutInfo).toBeUndefined();
  });
});
