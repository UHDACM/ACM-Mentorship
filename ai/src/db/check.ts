import { LRUCache } from "lru-cache";
import { DBGetWithID } from "./db";
import { isMetric } from "@shared/validation/metric";
import env from "../env/env";
import { DateUnixIsFromCurrentHour } from "../tools";


/**
 * Caches users that have exceeded tokens per minute
 */
const CacheSize = 15000; // currently optimized for 512 mb of ram.
interface TimeoutInformation {
  timeoutEnd: number;
}
export const UsersOnAIResumeTimeout = new LRUCache<string, TimeoutInformation>({ max: CacheSize });
export async function CheckUserBelowAIResumeQuota(userID: string): Promise<boolean> {
  // check if user is in timeout cache
  if (CheckUserHasAIResumeTimeout(userID)) {
    return false;
  }

  // even if not in cache, user may have exceeded quota recently
  const result = await DBGetWithID('metrics', userID);

  if (!result) {
    return true;
  }

  if (!isMetric(result)) {
    // TODO: not sure what to do here, but user can't proceed
    return false;
  }

  const aiResumeMetrics = result.AIResume;
  if (!aiResumeMetrics) {
    // no metrics, user is good
    return true;
  }

  if (aiResumeMetrics.tokensUsedLastHour.count >= env.AI_LIMITS.tokensUsedLastHour) {
    if (DateUnixIsFromCurrentHour(aiResumeMetrics.tokensUsedLastHour.timestamp)) {
      // user has exceeded token limit, 
      // and the last recorded usage is from the current hour
      // add to timeout cache
      AddUserToAIResumeTimeoutCacheTillNextHour(userID);
      return false;
    }
  } else if (aiResumeMetrics.requestsMadeLastHour.count >= env.AI_LIMITS.requestsMadeLastHour) {
    if (DateUnixIsFromCurrentHour(aiResumeMetrics.tokensUsedLastHour.timestamp)) {
      // user has exceeded token limit, 
      // and the last recorded usage is from the current hour
      // add to timeout cache
      AddUserToAIResumeTimeoutCacheTillNextHour(userID);
      return false;
    }
  }

  return true;
}

function AddUserToAIResumeTimeoutCacheTillNextHour(userID: string) {
  const now = new Date();
  const nextHour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours() + 1, 0, 0, 0);
  UsersOnAIResumeTimeout.set(userID, { timeoutEnd: nextHour.getTime() });
}

export function CheckUserHasAIResumeTimeout(userID: string): boolean {
  // check if user is in timeout cache
  // this allows us to avoid db reads for users that are already known to be on timeout
  const userTimeoutInfo = UsersOnAIResumeTimeout.get(userID);
  if (userTimeoutInfo) {

    // if user is still on timeout, return true
    if (Date.now() < userTimeoutInfo.timeoutEnd) {
      return true;
    }
  }
  
  UsersOnAIResumeTimeout.delete(userID);
  return false;
}

export function GetUserAIResumeTimeoutEnd(userID: string): number | undefined {
  const userTimeoutInfo = UsersOnAIResumeTimeout.get(userID);
  if (userTimeoutInfo) {
    return userTimeoutInfo.timeoutEnd;
  }
  return undefined;
}