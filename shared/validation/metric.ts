import { MetricCountTimestampObj, Metric } from "@shared/types/metric";

export function isMetric(obj: unknown): obj is Metric {
  if (obj === null || typeof obj !== 'object') {
    return false;
  }

  const { AIResume } = obj as Metric;

  // checks AIResume ==============
  if (typeof AIResume !== 'object') {
    return false;
  } else if (AIResume != null) {
    const { tokensUsedLastHour, requestsMadeLastHour } = (AIResume as Metric['AIResume'])!;
    if (tokensUsedLastHour != null && !isCountTimestampObj(tokensUsedLastHour)) {
      return false;
    }
    if (requestsMadeLastHour != null && !isCountTimestampObj(requestsMadeLastHour)) {
      return false;
    }
  }
  // ============================


  return true;
}


export function isCountTimestampObj(obj: any): obj is MetricCountTimestampObj {
  if (obj === null || typeof obj !== 'object') {
    return false;
  }

  const { count, timestamp } = obj as MetricCountTimestampObj;

  return typeof count === 'number' && typeof timestamp === 'number';
}