import { Headers } from "@cloudflare/workers-types";
import { HELICONE_RATE_LIMITED_API_KEY_REGEX } from "../util/apiKeyRegex";

type Nullable<T> = T | null;

export type HeliconeFallbackCode = number | { from: number; to: number };

export type HeliconeFallback = {
  "target-url": string;
  headers: Record<string, string>;
  onCodes: HeliconeFallbackCode[];
  bodyKeyOverride?: object;
};

export type HeliconeBearerKeyType = "standard" | "rate-limited";

export interface IHeliconeHeaders {
  heliconeAuth: Nullable<string>;
  heliconeAuthV2: Nullable<{
    _type: "jwt" | "bearer";
    token: string;
  }>;
  rateLimitPolicy: Nullable<string>;

  featureFlags: {
    streamForceFormat: boolean;
    increaseTimeout: boolean;
    streamUsage: boolean;
  };
  retryHeaders: Nullable<{
    enabled: boolean;
    retries: number;
    factor: number;
    minTimeout: number;
    maxTimeout: number;
  }>;
  openaiBaseUrl: Nullable<string>;
  targetBaseUrl: Nullable<string>;
  promptFormat: Nullable<string>;
  requestId: string;
  promptHeaders: {
    promptId: Nullable<string>;
    promptMode: Nullable<string>;
    promptVersion: Nullable<string>;
  };
  cacheHeaders: {
    cacheEnabled: Nullable<boolean>;
    cacheSeed: Nullable<number>;
    cacheBucketMaxSize: Nullable<number>;
    cacheControl: Nullable<string>;
  };
  promptName: Nullable<string>;
  userId: Nullable<string>;
  omitHeaders: {
    omitResponse: boolean;
    omitRequest: boolean;
  };
  sessionHeaders: {
    sessionId: Nullable<string>;
    path: Nullable<string>;
    name: Nullable<string>;
  };
  nodeId: Nullable<string>;
  fallBacks: Nullable<HeliconeFallback[]>;
  modelOverride: Nullable<string>;
  promptSecurityEnabled: Nullable<boolean>;
  promptSecurityAdvanced: Nullable<string>;
  moderationsEnabled: boolean;
  posthogKey: Nullable<string>;
  lytixKey: Nullable<string>;
  lytixHost: Nullable<string>;
  posthogHost: Nullable<string>;
  webhookEnabled: boolean;
  experimentHeaders: {
    columnId: Nullable<string>;
    rowIndex: Nullable<string>;
    experimentId: Nullable<string>;
  };
  heliconeManualAccessKey: Nullable<string>;
}

export class HeliconeHeaders implements IHeliconeHeaders {
  heliconeProperties: Record<string, string>;
  heliconeAuth: Nullable<string>;
  heliconeAuthV2: Nullable<{
    _type: "jwt" | "bearer";
    token: string;
    orgId?: string;
    keyType?: HeliconeBearerKeyType;
  }>;
  rateLimitPolicy: Nullable<string>;
  featureFlags: {
    streamForceFormat: boolean;
    increaseTimeout: boolean;
    streamUsage: boolean;
  };
  retryHeaders: Nullable<{
    enabled: boolean;
    retries: number;
    factor: number;
    minTimeout: number;
    maxTimeout: number;
  }>;
  openaiBaseUrl: Nullable<string>;
  targetBaseUrl: Nullable<string>;
  promptFormat: Nullable<string>;
  requestId: string;
  promptHeaders: {
    promptId: Nullable<string>;
    promptMode: Nullable<string>;
    promptVersion: Nullable<string>;
  };
  cacheHeaders: {
    cacheEnabled: Nullable<boolean>;
    cacheSeed: Nullable<number>;
    cacheBucketMaxSize: Nullable<number>;
    cacheControl: Nullable<string>;
  };
  promptName: Nullable<string>;
  userId: Nullable<string>;
  omitHeaders: { omitResponse: boolean; omitRequest: boolean };
  sessionHeaders: {
    sessionId: Nullable<string>;
    path: Nullable<string>;
    name: Nullable<string>;
  };
  nodeId: Nullable<string>;
  fallBacks: Nullable<HeliconeFallback[]>;
  modelOverride: Nullable<string>;
  promptSecurityEnabled: Nullable<boolean>;
  promptSecurityAdvanced: Nullable<string>;
  moderationsEnabled: boolean;
  posthogKey: Nullable<string>;
  posthogHost: Nullable<string>;
  webhookEnabled: boolean;

  experimentHeaders: {
    columnId: Nullable<string>;
    rowIndex: Nullable<string>;
    experimentId: Nullable<string>;
  };
  lytixKey: Nullable<string>;
  lytixHost: Nullable<string>;
  heliconeManualAccessKey: Nullable<string>;

  constructor(private headers: Headers) {
    const heliconeHeaders = this.getHeliconeHeaders();
    this.heliconeAuth = heliconeHeaders.heliconeAuth;
    this.heliconeAuthV2 = heliconeHeaders.heliconeAuthV2;
    this.rateLimitPolicy = heliconeHeaders.rateLimitPolicy;

    this.featureFlags = heliconeHeaders.featureFlags;
    this.retryHeaders = heliconeHeaders.retryHeaders;
    this.openaiBaseUrl = heliconeHeaders.openaiBaseUrl;
    this.targetBaseUrl = heliconeHeaders.targetBaseUrl;
    this.promptFormat = heliconeHeaders.promptFormat;
    this.requestId = heliconeHeaders.requestId;
    this.promptHeaders = {
      promptId: heliconeHeaders.promptHeaders.promptId,
      promptMode: heliconeHeaders.promptHeaders.promptMode,
      promptVersion: heliconeHeaders.promptHeaders.promptVersion,
    };
    this.cacheHeaders = {
      cacheEnabled: heliconeHeaders.cacheHeaders.cacheEnabled,
      cacheSeed: heliconeHeaders.cacheHeaders.cacheSeed,
      cacheBucketMaxSize: heliconeHeaders.cacheHeaders.cacheBucketMaxSize,
      cacheControl: heliconeHeaders.cacheHeaders.cacheControl,
    }
    this.promptName = heliconeHeaders.promptName;
    this.omitHeaders = heliconeHeaders.omitHeaders;
    this.sessionHeaders = heliconeHeaders.sessionHeaders;
    this.userId = heliconeHeaders.userId;
    this.heliconeProperties = this.getHeliconeProperties(heliconeHeaders);
    this.nodeId = heliconeHeaders.nodeId;
    this.fallBacks = this.getFallBacks();
    this.modelOverride = heliconeHeaders.modelOverride;
    this.promptSecurityEnabled = heliconeHeaders.promptSecurityEnabled;
    this.promptSecurityAdvanced = heliconeHeaders.promptSecurityAdvanced;
    this.moderationsEnabled = heliconeHeaders.moderationsEnabled;
    this.lytixKey = heliconeHeaders.lytixKey;
    this.lytixHost = heliconeHeaders.lytixHost;
    this.posthogKey = heliconeHeaders.posthogKey;
    this.posthogHost = heliconeHeaders.posthogHost;
    this.webhookEnabled = heliconeHeaders.webhookEnabled;

    this.experimentHeaders = {
      columnId: heliconeHeaders.experimentHeaders.columnId,
      rowIndex: heliconeHeaders.experimentHeaders.rowIndex,
      experimentId: heliconeHeaders.experimentHeaders.experimentId,
    };
    this.heliconeManualAccessKey = heliconeHeaders.heliconeManualAccessKey;
  }

  private getFallBacks(): Nullable<HeliconeFallback[]> {
    const fallBacks = this.headers.get("helicone-fallbacks");
    if (!fallBacks) {
      return null;
    }
    const parsedFallBacks = JSON.parse(fallBacks);
    if (!Array.isArray(parsedFallBacks)) {
      throw new Error("helicone-fallbacks must be an array");
    }
    return parsedFallBacks.map((fb) => {
      if (!fb["target-url"] || !fb.headers || !fb.onCodes) {
        throw new Error(
          "helicone-fallbacks must have target-url, headers, and onCodes"
        );
      }

      if (typeof fb["target-url"] !== "string") {
        throw new Error("helicone-fallbacks target-url must be a string");
      }

      if (
        typeof fb.headers !== "object" &&
        fb.headers.entries.every(
          ([key, value]: [object, object]) =>
            typeof key === "string" && typeof value === "string"
        )
      ) {
        throw new Error("helicone-fallbacks headers must be an object");
      }

      if (
        !Array.isArray(fb.onCodes) &&
        fb.onCodes.every(
          (x: HeliconeFallbackCode) =>
            typeof x === "number" ||
            (typeof x === "object" &&
              typeof x.from === "number" &&
              typeof x.to === "number")
        )
      ) {
        throw new Error("helicone-fallbacks onCodes must be an array");
      }

      return {
        "target-url": fb["target-url"],
        headers: fb.headers,
        onCodes: fb.onCodes,
        bodyKeyOverride: fb.bodyKeyOverride,
      };
    });
  }

  private getHeliconeAuthV2(): Nullable<{
    _type: "jwt" | "bearer";
    token: string;
    orgId?: string;
    keyType?: HeliconeBearerKeyType;
  }> {
    const heliconeAuth = this.headers.get("helicone-auth");

    if (heliconeAuth) {
      return {
        _type: "bearer",
        token: heliconeAuth,
        keyType: this.determineBearerKeyType(heliconeAuth),
      };
    }
    const heliconeAuthFallback = this.headers.get("authorization");
    if (heliconeAuthFallback) {
      return {
        _type: "bearer",
        token: heliconeAuthFallback,
        keyType: this.determineBearerKeyType(heliconeAuthFallback),
      };
    }
    const heliconeAuthJWT = this.headers.get("helicone-jwt");
    if (heliconeAuthJWT) {
      return {
        _type: "jwt",
        token: heliconeAuthJWT,
        orgId: this.headers.get("helicone-org-id") ?? undefined,
      };
    }
    return null;
  }

  determineBearerKeyType(bearerKey: string): HeliconeBearerKeyType {
    try {
      const key = bearerKey.replace("Bearer ", "").trim();

      if (
        HELICONE_RATE_LIMITED_API_KEY_REGEX.some((pattern) => pattern.test(key))
      ) {
        return "rate-limited";
      }

      return "standard";
    } catch (e) {
      console.error(`Error determining bearer key type: ${e}`);
      return "standard";
    }
  }

  setModelOverride(modelOverride: string | null) {
    this.modelOverride = modelOverride;
  }

  private getHeliconeHeaders(): IHeliconeHeaders {
    const requestId = this.getValidUUID(
      this.headers.get("Helicone-Request-Id")
    );

    return {
      heliconeAuth: this.headers.get("helicone-auth") ?? null,
      heliconeAuthV2: this.getHeliconeAuthV2(),
      featureFlags: this.getHeliconeFeatureFlags(),
      rateLimitPolicy: this.headers.get("Helicone-RateLimit-Policy") ?? null,
      openaiBaseUrl: this.headers.get("Helicone-OpenAI-Api-Base") ?? null,
      targetBaseUrl: this.headers.get("Helicone-Target-URL") ?? null,
      retryHeaders: this.getRetryHeaders(),
      promptFormat: this.headers.get("Helicone-Prompt-Format") ?? null,
      requestId: requestId,
      promptHeaders: {
        promptId: this.headers.get("Helicone-Prompt-Id") ?? null,
        promptMode: this.headers.get("Helicone-Prompt-Mode") ?? null,
        promptVersion: this.headers.get("Helicone-Prompt-Version") ?? null,
      },
      cacheHeaders: {
        cacheEnabled: this.headers.get("Helicone-Cache-Enabled") === "true" ? true : false,
        cacheSeed: this.headers.get("Helicone-Cache-Seed") ? parseInt(this.headers.get("Helicone-Cache-Seed") ?? "0") : null,
        cacheBucketMaxSize: this.headers.get("Helicone-Cache-Bucket-Max-Size") ? parseInt(this.headers.get("Helicone-Cache-Bucket-Max-Size") ?? "0") : null,
        cacheControl: this.headers.get("Helicone-Cache-Control") ?? null,
      },
      promptName: this.headers.get("Helicone-Prompt-Name") ?? null,
      userId: this.headers.get("Helicone-User-Id") ?? null,
      omitHeaders: {
        omitResponse: this.headers.get("Helicone-Omit-Response") === "true",
        omitRequest: this.headers.get("Helicone-Omit-Request") === "true",
      },
      sessionHeaders: {
        sessionId: this.headers.get("Helicone-Session-Id") ?? null,
        path: this.headers.get("Helicone-Session-Path") ?? null,
        name: this.headers.get("Helicone-Session-Name") ?? null,
      },
      nodeId: this.headers.get("Helicone-Node-Id") ?? null,
      fallBacks: this.getFallBacks(),
      modelOverride:
        this.modelOverride ??
        this.headers.get("Helicone-Model-Override") ??
        null,
      promptSecurityEnabled:
        (this.headers.get("Helicone-LLM-Security-Enabled") ??
          this.headers.get("Helicone-Prompt-Security-Enabled") ??
          "").toLowerCase() === "true"
      ,
      promptSecurityAdvanced:
        this.headers.get("Helicone-LLM-Security-Advanced") ?? null,
      moderationsEnabled:
        this.headers.get("Helicone-Moderations-Enabled") == "true"
          ? true
          : false,
      posthogKey: this.headers.get("Helicone-Posthog-Key") ?? null,
      lytixKey: this.headers.get("Helicone-Lytix-Key") ?? null,
      lytixHost: this.headers.get("Helicone-Lytix-Host") ?? null,
      posthogHost: this.headers.get("Helicone-Posthog-Host") ?? null,
      webhookEnabled:
        this.headers.get("Helicone-Webhook-Enabled") == "true" ? true : false,
      experimentHeaders: {
        experimentId: this.headers.get("Helicone-Experiment-Id") ?? null,
        columnId: this.headers.get("Helicone-Experiment-Column-Id") ?? null,
        rowIndex: this.headers.get("Helicone-Experiment-Row-Index") ?? null,
      },
      heliconeManualAccessKey:
        this.headers.get("Helicone-Manual-Access-Key") ?? null,
    };
  }

  private getRetryHeaders(): IHeliconeHeaders["retryHeaders"] {
    const retryEnabled = this.headers.get("helicone-retry-enabled");
    if (retryEnabled === null) {
      return null;
    }
    return {
      enabled: retryEnabled === "true",
      retries: parseInt(this.headers.get("helicone-retry-num") ?? "5", 10),
      factor: parseFloat(this.headers.get("helicone-retry-factor") ?? "2"),
      minTimeout: parseInt(
        this.headers.get("helicone-retry-min-timeout") ?? "1000",
        10
      ),
      maxTimeout: parseInt(
        this.headers.get("helicone-retry-max-timeout") ?? "10000",
        10
      ),
    };
  }

  private getHeliconeFeatureFlags(): IHeliconeHeaders["featureFlags"] {
    const streamForceFormat = this.headers.get("helicone-stream-force-format");
    const increaseTimeout = this.headers.get("helicone-increase-timeout");
    const streamUsage = this.headers.get("helicone-stream-usage");
    return {
      streamForceFormat: streamForceFormat === "true",
      increaseTimeout: increaseTimeout === "true",
      streamUsage: streamUsage === "true",
    };
  }

  private getHeliconeProperties(
    heliconeHeaders: IHeliconeHeaders
  ): Record<string, string> {
    const propTag = "helicone-property-";
    const heliconePropertyHeaders = Object.fromEntries(
      [...this.headers.entries()]
        .filter(
          ([key]) =>
            key.toLowerCase().startsWith(propTag.toLowerCase()) &&
            key.length > propTag.length
        )
        .map(([key, value]) => [key.substring(propTag.length), value])
    );

    if (this.headers.get("Helicone-Posthog-Key")) {
      heliconePropertyHeaders["Helicone-Sent-To-Posthog"] = "true";
    }

    if (heliconeHeaders.promptHeaders.promptId) {
      heliconePropertyHeaders["Helicone-Prompt-Id"] =
        heliconeHeaders.promptHeaders.promptId;
    }
    if (heliconeHeaders.sessionHeaders.name) {
      heliconePropertyHeaders[`Helicone-Session-Name`] =
        heliconeHeaders.sessionHeaders.name;
    }
    if (heliconeHeaders.sessionHeaders.sessionId) {
      heliconePropertyHeaders["Helicone-Session-Id"] =
        heliconeHeaders.sessionHeaders.sessionId;
    }

    if (heliconeHeaders.sessionHeaders.path) {
      heliconePropertyHeaders["Helicone-Session-Path"] =
        heliconeHeaders.sessionHeaders.path;
    }

    if (heliconeHeaders.experimentHeaders.experimentId) {
      heliconePropertyHeaders["Helicone-Experiment-Id"] =
        heliconeHeaders.experimentHeaders.experimentId;
    }

    if (heliconeHeaders.cacheHeaders.cacheEnabled) {
      heliconePropertyHeaders["Helicone-Cache-Enabled"] = heliconeHeaders.cacheHeaders.cacheEnabled.toString();
    }

    if (heliconeHeaders.cacheHeaders.cacheSeed) {
      heliconePropertyHeaders["Helicone-Cache-Seed"] = heliconeHeaders.cacheHeaders.cacheSeed.toString();
    }

    if (heliconeHeaders.cacheHeaders.cacheBucketMaxSize) {
      heliconePropertyHeaders["Helicone-Cache-Bucket-Max-Size"] = heliconeHeaders.cacheHeaders.cacheBucketMaxSize.toString();
    }

    if (heliconeHeaders.cacheHeaders.cacheControl) {
      heliconePropertyHeaders["Helicone-Cache-Control"] = heliconeHeaders.cacheHeaders.cacheControl;
    }

    return heliconePropertyHeaders;
  }

  getValidUUID(uuid: string | undefined | null): string {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (uuid && uuidRegex.test(uuid)) {
      return uuid;
    }
    return crypto.randomUUID();
  }
}
