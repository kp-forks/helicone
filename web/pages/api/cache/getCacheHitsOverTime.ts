import { getXOverTimeCacheHits } from "../../../lib/api/metrics/getXOverTime";
import { DataOverTimeRequest } from "../../../lib/api/metrics/timeDataHandlerWrapper";
import { Result, resultMap } from "@/packages/common/result";

export interface CacheHitsOverTime {
  count: number;
  time: Date;
}

export async function getCacheHitsOverTime(
  data: DataOverTimeRequest,
): Promise<Result<CacheHitsOverTime[], string>> {
  const res = await getXOverTimeCacheHits<{
    count: number;
    status: number;
  }>(data, "sum(cache_hit_count) as count");
  return resultMap(res, (resData) =>
    resData.map((d) => ({
      time: new Date(new Date(d.created_at_trunc).getTime()),
      count: Number(d.count),
    })),
  );
}
