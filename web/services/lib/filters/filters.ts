import {
  AllOperators,
  AnyOperator,
  FilterBranch,
  FilterLeaf,
  FilterNode,
  TablesAndViews,
} from "./filterDefs";

type KeyMapper<T> = (
  filter: T,
  placeValueSafely: (val: string) => string
) => {
  column?: string;
  operator: AllOperators;
  value: string;
};

type KeyMappings = {
  [key in keyof TablesAndViews]: KeyMapper<TablesAndViews[key]>;
};

const extractOperatorAndValueFromAnOperator = (
  operator: AnyOperator
): { operator: AllOperators; value: any } => {
  for (const key in operator) {
    return {
      operator: key as AllOperators,
      value: operator[key as keyof typeof operator],
    };
  }
  throw new Error(`Invalid operator ${JSON.stringify(operator)}`);
};

function easyKeyMappings<T extends keyof TablesAndViews>(
  keyMappings: {
    [key in keyof TablesAndViews[T]]: string;
  },
  table?: T
): KeyMapper<TablesAndViews[T]> {
  return (key, placeValueSafely) => {
    const column = Object.keys(key)[0] as keyof typeof keyMappings;
    const columnFromMapping = keyMappings[column];
    const { operator, value } = extractOperatorAndValueFromAnOperator(
      key[column as keyof typeof keyMappings] as AnyOperator
    );

    let columnToUse = undefined;
    if (columnFromMapping) {
      if (table) {
        columnToUse = `${table}.${columnFromMapping}`;
      } else {
        columnToUse = columnFromMapping;
      }
    }

    return {
      column: columnToUse,
      operator: operator,
      value: placeValueSafely(value),
    };
  };
}
const NOT_IMPLEMENTED = () => {
  throw new Error("Not implemented");
};

const whereKeyMappings: KeyMappings = {
  user_metrics: easyKeyMappings(
    {
      user_id: "user_id",
      last_active: "last_active",
      total_requests: "total_requests",
    },
    "user_metrics"
  ),
  user_api_keys: easyKeyMappings(
    {
      api_key_hash: "api_key_hash",
      api_key_name: "api_key_name",
    },
    "user_api_keys"
  ),
  properties: (filter, placeValueSafely) => {
    const keys = Object.keys(filter);
    if (keys.length !== 1) {
      throw new Error("Invalid filter, only one key is allowed");
    }
    const key = keys[0];
    const { operator, value } = extractOperatorAndValueFromAnOperator(
      filter[key as keyof typeof filter]
    );
    return {
      column: `properties ->> ${placeValueSafely(key)}`,
      operator: operator,
      value: placeValueSafely(value),
    };
  },
  request: easyKeyMappings<"request">({
    prompt: `coalesce(request.body ->>'prompt', request.body ->'messages'->0->>'content')`,
    created_at: "request.created_at",
    user_id: "request.user_id",
    auth_hash: "request.auth_hash",
    org_id: "request.helicone_org_id",
    id: "request.id",
    node_id: "job_node_request.node_id",
    model: "request.model",
    modelOverride: "request.model_override",
    path: "request.path",
    country_code: "request.country_code",
  }),
  response: easyKeyMappings<"response">({
    body_completion:
      "(coalesce(response.body ->'choices'->0->>'text', response.body ->'choices'->0->>'message'))::text",
    body_model:
      "(coalesce(request.model_override, response.model, request.model, response.body ->> 'model', request.body ->> 'model'))::text",
    body_tokens: "((response.body -> 'usage') ->> 'total_tokens')::bigint",
    status: "response.status",
    model: "response.model",
  }),
  properties_table: easyKeyMappings<"properties_table">({
    auth_hash: "properties.auth_hash",
    key: "properties.key",
    value: "properties.value",
  }),
  feedback: easyKeyMappings<"feedback">({
    rating: "feedback.rating",
    id: "feedback.id",
    created_at: "feedback.created_at",
    response_id: "feedback.response_id",
  }),
  cache_hits: easyKeyMappings<"cache_hits">({
    organization_id: "cache_hits.organization_id",
    request_id: "cache_hits.request_id",
    latency: "cache_hits.latency",
    completion_tokens: "cache_hits.completion_tokens",
    prompt_tokens: "cache_hits.prompt_tokens",
    created_at: "cache_hits.created_at",
  }),
  request_response_log: easyKeyMappings<"request_response_log">({
    latency: "request_response_log.latency",
    status: "request_response_log.status",
    request_created_at: "request_response_log.request_created_at",
    response_created_at: "request_response_log.response_created_at",
    auth_hash: "request_response_log.auth_hash",
    model: "request_response_log.model",
    user_id: "request_response_log.user_id",
    organization_id: "request_response_log.organization_id",
    node_id: "request_response_log.node_id",
    job_id: "request_response_log.job_id",
    threat: "request_response_log.threat",
  }),
  request_response_rmt: (filter, placeValueSafely) => {
    if ("properties" in filter && filter.properties) {
      const key = Object.keys(filter.properties)[0];
      const { operator, value } = extractOperatorAndValueFromAnOperator(
        filter.properties[key as keyof typeof filter.properties]
      );
      return {
        column: `properties[${placeValueSafely(key)}]`,
        operator: operator,
        value: placeValueSafely(value),
      };
    }
    if ("search_properties" in filter && filter.search_properties) {
      const key = Object.keys(filter.search_properties)[0];
      const { operator, value } = extractOperatorAndValueFromAnOperator(
        filter.search_properties[key as keyof typeof filter.search_properties]
      );
      return {
        column: `key`,
        operator: operator,
        value: placeValueSafely(value),
      };
    }
    if ("scores" in filter && filter.scores) {
      const key = Object.keys(filter.scores)[0];
      const { operator, value } = extractOperatorAndValueFromAnOperator(
        filter.scores[key as keyof typeof filter.scores]
      );
      return {
        column: `has(scores, ${placeValueSafely(
          key
        )}) AND scores[${placeValueSafely(key)}]`,
        operator: operator,
        value: value,
      };
    }
    return easyKeyMappings<"request_response_rmt">({
      latency: "request_response_rmt.latency",
      status: "request_response_rmt.status",
      request_created_at: "request_response_rmt.request_created_at",
      response_created_at: "request_response_rmt.response_created_at",
      model: "request_response_rmt.model",
      user_id: "request_response_rmt.user_id",
      organization_id: "request_response_rmt.organization_id",
      node_id: "request_response_rmt.node_id",
      job_id: "request_response_rmtd",
      threat: "request_response_rmt.threat",
      prompt_tokens: "request_response_rmt.prompt_tokens",
      completion_tokens: "request_response_rmt.completion_tokens",
      request_body: "request_response_rmt.request_body",
      response_body: "request_response_rmt.response_body",
      cache_reference_id: "request_response_rmt.cache_reference_id",
      cache_enabled: "request_response_rmt.cache_enabled",
    })(filter, placeValueSafely);
  },
  users_view: easyKeyMappings<"request_response_rmt">({
    status: "r.status",
    user_id: "r.user_id",
  }),
  properties_v3: easyKeyMappings<"properties_v3">({
    key: "properties_v3.key",
    value: "properties_v3.value",
    organization_id: "properties_v3.organization_id",
  }),
  property_with_response_v1: easyKeyMappings<"property_with_response_v1">({
    property_key: "property_with_response_v1.property_key",
    property_value: "property_with_response_v1.property_value",
    request_created_at: "property_with_response_v1.request_created_at",
    organization_id: "property_with_response_v1.organization_id",
    threat: "property_with_response_v1.threat",
  }),
  rate_limit_log: easyKeyMappings<"rate_limit_log">({
    organization_id: "rate_limit_log.organization_id",
    created_at: "rate_limit_log.created_at",
  }),
  sessions_request_response_rmt:
    easyKeyMappings<"sessions_request_response_rmt">({}),
  cache_metrics: easyKeyMappings<"cache_metrics">({
    organization_id: "cache_metrics.organization_id",
    date: "cache_metrics.date",
    hour: "cache_metrics.hour",
    request_id: "cache_metrics.request_id",
    model: "cache_metrics.model",
    saved_latency_ms: "cache_metrics.saved_latency_ms",
    saved_completion_tokens: "cache_metrics.saved_completion_tokens",
    saved_prompt_tokens: "cache_metrics.saved_prompt_tokens",
    saved_completion_audio_tokens: "cache_metrics.saved_completion_audio_tokens",
    saved_prompt_audio_tokens: "cache_metrics.saved_prompt_audio_tokens",
    saved_prompt_cache_write_tokens: "cache_metrics.saved_prompt_cache_write_tokens",
    saved_prompt_cache_read_tokens: "cache_metrics.saved_prompt_cache_read_tokens",
    first_hit: "cache_metrics.first_hit",
    last_hit: "cache_metrics.last_hit",
    request_body: "cache_metrics.request_body",
    response_body: "cache_metrics.response_body",
  }),

  // Deprecated
  values: NOT_IMPLEMENTED,
  job: NOT_IMPLEMENTED,
  job_node: NOT_IMPLEMENTED,
};

const havingKeyMappings: KeyMappings = {
  user_metrics: easyKeyMappings<"user_metrics">({
    last_active: "max(request.created_at)",
    total_requests: "count(request.id)",
  }),
  users_view: easyKeyMappings<"users_view">({
    active_for: "active_for",
    first_active: "first_active",
    last_active: "last_active",
    total_requests: "total_requests",
    average_requests_per_day_active: "average_requests_per_day_active",
    average_tokens_per_request: "average_tokens_per_request",
    total_completion_tokens: "total_completion_tokens",
    total_prompt_token: "total_prompt_token",
    cost: "cost",
  }),
  sessions_request_response_rmt:
    easyKeyMappings<"sessions_request_response_rmt">({
      total_cost: "total_cost",
      total_tokens: "total_tokens",
    }),
  user_api_keys: NOT_IMPLEMENTED,
  properties: NOT_IMPLEMENTED,
  request: NOT_IMPLEMENTED,
  response: NOT_IMPLEMENTED,
  properties_table: NOT_IMPLEMENTED,
  request_response_log: NOT_IMPLEMENTED,
  request_response_rmt: (filter, placeValueSafely) => {
    if ("properties" in filter && filter.properties) {
      const key = Object.keys(filter.properties)[0];
      const { operator, value } = extractOperatorAndValueFromAnOperator(
        filter.properties[key as keyof typeof filter.properties]
      );
      return {
        column: `properties[${placeValueSafely(key)}]`,
        operator: operator,
        value: placeValueSafely(value),
      };
    }
    if ("search_properties" in filter && filter.search_properties) {
      const key = Object.keys(filter.search_properties)[0];
      const { operator, value } = extractOperatorAndValueFromAnOperator(
        filter.search_properties[key as keyof typeof filter.search_properties]
      );
      return {
        column: `key`,
        operator: operator,
        value: placeValueSafely(value),
      };
    }
    if ("scores" in filter && filter.scores) {
      const key = Object.keys(filter.scores)[0];
      const { operator, value } = extractOperatorAndValueFromAnOperator(
        filter.scores[key as keyof typeof filter.scores]
      );
      return {
        column: `has(scores, ${placeValueSafely(
          key
        )}) AND scores[${placeValueSafely(key)}]`,
        operator: operator,
        value: value,
      };
    }
    return easyKeyMappings<"request_response_rmt">({
      latency: "request_response_rmt",
      status: "request_response_rmt.status",
      request_created_at: "request_response_rmt.request_created_at",
      response_created_at: "request_response_rmt.response_created_at",
      model: "request_response_rmt.model",
      user_id: "request_response_rmt.user_id",
      organization_id: "request_response_rmt.organization_id",
      node_id: "request_response_rmt.node_id",
      job_id: "request_response_rmt.job_id",
      threat: "request_response_rmt.threat",
    })(filter, placeValueSafely);
  },
  properties_v3: NOT_IMPLEMENTED,
  property_with_response_v1: NOT_IMPLEMENTED,
  feedback: NOT_IMPLEMENTED,
  cache_hits: NOT_IMPLEMENTED,
  rate_limit_log: NOT_IMPLEMENTED,
  cache_metrics: easyKeyMappings<"cache_metrics">({
    organization_id: "cache_metrics.organization_id",
    date: "cache_metrics.date",
    hour: "cache_metrics.hour",
    request_id: "cache_metrics.request_id",
    model: "cache_metrics.model",
    saved_latency_ms: "cache_metrics.saved_latency_ms",
    saved_completion_tokens: "cache_metrics.saved_completion_tokens",
    saved_prompt_tokens: "cache_metrics.saved_prompt_tokens",
    saved_completion_audio_tokens: "cache_metrics.saved_completion_audio_tokens",
    saved_prompt_audio_tokens: "cache_metrics.saved_prompt_audio_tokens",
    saved_prompt_cache_write_tokens: "cache_metrics.saved_prompt_cache_write_tokens",
    saved_prompt_cache_read_tokens: "cache_metrics.saved_prompt_cache_read_tokens",
    first_hit: "cache_metrics.first_hit",
    last_hit: "cache_metrics.last_hit",
    request_body: "cache_metrics.request_body",
    response_body: "cache_metrics.response_body",
  }),
  // Deprecated
  values: NOT_IMPLEMENTED,
  job: NOT_IMPLEMENTED,
  job_node: NOT_IMPLEMENTED,
};

function operatorToSql(operator: AllOperators): string {
  switch (operator) {
    case "equals":
      return "=";
    case "not-equals":
      return "!=";
    case "like":
      return "LIKE";
    case "ilike":
      return "ILIKE";
    case "gte":
      return ">=";
    case "gt":
      return ">";
    case "lt":
      return "<";
    case "lte":
      return "<=";
    case "contains":
      return "ILIKE";
    case "not-contains":
      return "NOT ILIKE";
    case "vector-contains":
      return "@@";
  }
}

export function buildFilterLeaf(
  filter: FilterLeaf,
  argsAcc: any[],
  keyMappings: KeyMappings,
  argPlaceHolder: (arg_index: number, arg: any) => string
): {
  filters: string[];
  argsAcc: any[];
} {
  const placeValueSafely = (value: string) => {
    argsAcc.push(value);
    return argPlaceHolder(argsAcc.length - 1, value);
  };

  const filters: string[] = [];

  for (const _tableKey in filter) {
    const tableKey = _tableKey as keyof typeof filter;
    const table = filter[tableKey];
    const mapper = keyMappings[tableKey] as KeyMapper<typeof table>;
    const {
      column,
      operator: operatorKey,
      value,
    } = mapper(table, placeValueSafely);

    if (!column) {
      continue;
    }

    const sqlOperator = operatorToSql(operatorKey);

    if (operatorKey === "not-equals" && value === "null") {
      filters.push(`${column} is not null`);
    } else if (operatorKey === "equals" && value === "null") {
      filters.push(`${column} is null`);
    } else {
      if (operatorKey === "contains" || operatorKey === "not-contains") {
        filters.push(`${column} ${sqlOperator} '%' || ${value}::text || '%'`);
      } else {
        filters.push(`${column} ${sqlOperator} ${value}`);
      }
    }
  }

  return {
    filters,
    argsAcc,
  };
}

export function buildFilterBranch(
  args: Omit<BuildFilterArgs, "filter"> & { filter: FilterBranch }
): {
  filter: string;
  argsAcc: any[];
} {
  const { filter, argPlaceHolder, argsAcc, having } = args;
  if (filter.operator !== "or" && filter.operator !== "and") {
    throw new Error("Invalid filter: only OR is supported");
  }
  const { filter: leftFilter, argsAcc: leftArgsAcc } = buildFilter({
    ...args,
    filter: filter.left,
    argsAcc,
    argPlaceHolder,
    having,
  });
  const { filter: rightFilter, argsAcc: rightArgsAcc } = buildFilter({
    ...args,
    filter: filter.right,
    argsAcc: leftArgsAcc,
    argPlaceHolder,
    having,
  });
  return {
    filter: `(${leftFilter} ${filter.operator} ${rightFilter})`,
    argsAcc: rightArgsAcc,
  };
}

export function buildFilter(args: BuildFilterArgs): {
  filter: string;
  argsAcc: any[];
} {
  const { filter, argPlaceHolder, argsAcc, having } = args;
  if (filter === "all") {
    return {
      filter: "true",
      argsAcc,
    };
  }
  if ("left" in filter) {
    return buildFilterBranch({
      ...args,
      filter,
      argsAcc,
      argPlaceHolder,
      having,
    });
  }

  const res = buildFilterLeaf(
    filter,
    argsAcc,
    having ? havingKeyMappings : whereKeyMappings,
    argPlaceHolder
  );

  if (res.filters.length === 0) {
    return {
      filter: "true",
      argsAcc: res.argsAcc,
    };
  }
  return {
    filter: res.filters.join(" AND "),
    argsAcc: res.argsAcc,
  };
}

export function clickhouseParam(index: number, parameter: any) {
  if (typeof parameter === "number") {
    if (Number.isInteger(parameter)) {
      return `{val_${index} : Int32}`;
    } else {
      return `{val_${index} : Float64}`;
    }
  } else if (typeof parameter === "boolean") {
    return `{val_${index} : UInt8}`;
  } else if (parameter instanceof Date) {
    return `{val_${index} : DateTime}`;
  } else {
    return `{val_${index} : String}`;
  }
}

export function buildFilterClickHouse(
  args: ExternalBuildFilterArgs
): ReturnType<typeof buildFilter> {
  return buildFilter({
    ...args,
    argPlaceHolder: clickhouseParam,
  });
}

function buildFilterPostgres(
  args: ExternalBuildFilterArgs
): ReturnType<typeof buildFilter> {
  return buildFilter({
    ...args,
    argPlaceHolder: (index, parameter) => `$${index + 1}`,
  });
}

export interface BuildFilterArgs {
  filter: FilterNode;
  argsAcc: any[];
  having?: boolean;
  argPlaceHolder: (arg_index: number, arg: any) => string;
}
export type ExternalBuildFilterArgs = Omit<
  BuildFilterArgs,
  "argPlaceHolder" | "user_id"
>;

export async function buildFilterWithAuthClickHouse(
  args: ExternalBuildFilterArgs & { org_id: string }
): Promise<{ filter: string; argsAcc: any[] }> {
  return buildFilterWithAuth(args, "clickhouse", (orgId) => ({
    request_response_rmt: {
      organization_id: {
        equals: orgId,
      },
    },
  }));
}

export async function buildFilterWithAuthClickHousePropResponse(
  args: ExternalBuildFilterArgs & { org_id: string }
): Promise<{ filter: string; argsAcc: any[] }> {
  return buildFilterWithAuth(args, "clickhouse", (orgId) => ({
    property_with_response_v1: {
      organization_id: {
        equals: orgId,
      },
    },
  }));
}

export async function buildFilterWithAuthClickHouseProperties(
  args: ExternalBuildFilterArgs & { org_id: string }
): Promise<{ filter: string; argsAcc: any[] }> {
  return buildFilterWithAuth(args, "clickhouse", (orgId) => ({
    properties_v3: {
      organization_id: {
        equals: orgId,
      },
    },
  }));
}

export async function buildFilterWithAuthClickHousePropertiesV2(
  args: ExternalBuildFilterArgs & { org_id: string }
): Promise<{ filter: string; argsAcc: any[] }> {
  return buildFilterWithAuth(args, "clickhouse", (orgId) => ({
    request_response_rmt: {
      organization_id: {
        equals: orgId,
      },
    },
  }));
}

export async function buildFilterWithAuthClickHouseCacheHits(
  args: ExternalBuildFilterArgs & { org_id: string }
): Promise<{ filter: string; argsAcc: any[] }> {
  return buildFilterWithAuth(args, "clickhouse", (orgId) => ({
    cache_hits: {
      organization_id: {
        equals: orgId,
      },
    },
  }));
}


export async function buildFilterWithAuthClickHouseCacheMetrics(
  args: ExternalBuildFilterArgs & { org_id: string }
): Promise<{ filter: string; argsAcc: any[] }> {
  return buildFilterWithAuth(args, "clickhouse", (orgId) => ({
    cache_metrics: {
      organization_id: {
        equals: orgId,
      },
    },
  }));
}


export async function buildFilterWithAuthClickHouseRateLimits(
  args: ExternalBuildFilterArgs & { org_id: string }
): Promise<{ filter: string; argsAcc: any[] }> {
  return buildFilterWithAuth(args, "clickhouse", (orgId) => ({
    rate_limit_log: {
      organization_id: {
        equals: orgId,
      },
    },
  }));
}

export async function buildFilterWithAuth(
  args: ExternalBuildFilterArgs & {
    org_id: string;
  },
  database: "postgres" | "clickhouse" = "postgres",
  getOrgIdFilter: (orgId: string) => FilterLeaf = (orgId) => ({
    request: {
      org_id: {
        equals: orgId,
      },
    },
  })
): Promise<{ filter: string; argsAcc: any[] }> {
  const { org_id, filter } = args;

  const filterNode: FilterNode = {
    left: getOrgIdFilter(org_id),
    operator: "and",
    right: filter,
  };

  const filterBuilder =
    database === "clickhouse" ? buildFilterClickHouse : buildFilterPostgres;

  return filterBuilder({
    ...args,
    filter: filterNode,
  });
}
