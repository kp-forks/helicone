import { Result, resultMap } from "@/packages/common/result";
import { getXOverTimeRateLimit } from "./getXOverTime";
import { DataOverTimeRequest } from "./timeDataHandlerWrapper";

export async function getRateLimitOverTime(
  data: DataOverTimeRequest,
  groupByColumns: string[] = [],
  printQuery = false,
): Promise<Result<RateLimitOverTime[], string>> {
  const res = await getXOverTimeRateLimit<{
    count: number;
    status: number;
  }>(data, "count(*) as count", groupByColumns, printQuery);
  return resultMap(res, (resData) =>
    resData.map((d) => ({
      time: new Date(new Date(d.created_at_trunc).getTime()),
      count: Number(d.count),
      status: Number(d.status),
    })),
  );
}
export interface RateLimitOverTime {
  count: number;
  time: Date;
}
