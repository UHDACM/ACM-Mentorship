import { DBObj } from "./general";

export interface Metric extends DBObj {
  AIResume?: {
    tokensUsedLastHour: MetricCountTimestampObj,
    requestsMadeLastHour: MetricCountTimestampObj
  } | null;
};

export interface MetricCountTimestampObj {
  count: number;
  timestamp: number;
}