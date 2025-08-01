import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "../../../supabase/database.types";

export type APIKey = {
  api_key_hash: string;
  organization_id: string;
};

export class APIKeysStore {
  constructor(private supabaseClient: SupabaseClient<Database>) {}

  async getAPIKeys(): Promise<APIKey[] | null> {
    const pageSize = 1000;
    let allData: APIKey[] = [];
    let offset = 0;

    while (true) {
      const { data, error } = await this.supabaseClient
        .from("helicone_api_keys")
        .select("organization_id, api_key_hash")
        .eq("soft_delete", false)
        .eq("temp_key", false)
        .neq("api_key_name", "auto-generated-experiment-key")
        .range(offset, offset + pageSize - 1);

      if (error) {
        return null;
      }

      if (!data || data.length === 0) {
        break;
      }

      allData.push(...data);

      // If we got fewer results than the page size, we've reached the end
      if (data.length < pageSize) {
        break;
      }

      offset += pageSize;
    }

    return allData;
  }

  async getAPIKeyWithFetch(apiKeyHash: string): Promise<APIKey | null> {
    const { data, error } = await this.supabaseClient
      .from("helicone_api_keys")
      .select("organization_id, api_key_hash")
      .eq("api_key_hash", apiKeyHash)
      .eq("soft_delete", false);

    if (error) {
      return null;
    }

    if (data.length === 0) {
      return null;
    }

    return data[0];
  }
}
