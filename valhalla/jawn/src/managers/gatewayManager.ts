import { dbExecute } from "../lib/shared/db/dbExecute";
import { AuthParams } from "../packages/common/auth/types";
import { err, ok, Result } from "../packages/common/result";
import { BaseManager } from "./BaseManager";
import crypto from "crypto";
import { KeyManager } from "./apiKeys/KeyManager";
import {
  CreateRouterResult,
  LatestRouterConfig,
  Router,
} from "../controllers/public/gatewayController";
import { init } from "@paralleldrive/cuid2";

export class GatewayManager extends BaseManager {
  constructor(authParams: AuthParams) {
    super(authParams);
  }

  async getRouters(): Promise<
    Result<
      {
        routers: Router[];
      },
      string
    >
  > {
    const result = await dbExecute<Router>(
      `SELECT
        routers.id,
        routers.hash,
        routers.name,
        latest_config.version as "latestVersion",
        latest_config.created_at as "lastUpdatedAt"
      FROM routers
      INNER JOIN (
        SELECT DISTINCT ON (router_id)
          router_id,
          version,
          created_at
        FROM router_config_versions
        ORDER BY router_id, created_at DESC
      ) latest_config ON routers.id = latest_config.router_id
      WHERE routers.organization_id = $1
      ORDER BY latest_config.created_at DESC`,
      [this.authParams.organizationId]
    );

    if (result.error || !result.data) {
      return err(`Failed to get gateway configs: ${result.error}`);
    }

    return ok({ routers: result.data });
  }

  async getLatestRouterConfig(
    id: string
  ): Promise<Result<LatestRouterConfig, string>> {
    const result = await dbExecute<LatestRouterConfig>(
      `SELECT routers.id, routers.hash, routers.name, router_config_versions.version, router_config_versions.config
      FROM routers
      INNER JOIN router_config_versions ON routers.id = router_config_versions.router_id
      WHERE routers.id = $1 AND routers.organization_id = $2
      ORDER BY router_config_versions.created_at DESC
      LIMIT 1`,
      [id, this.authParams.organizationId]
    );

    if (result.error || !result.data) {
      return err(`Failed to get gateway config: ${result.error}`);
    }

    return ok(result.data[0]);
  }

  async createRouter(params: {
    name?: string;
    config?: string;
  }): Promise<Result<CreateRouterResult, string>> {
    const { name, config } = params;
    const createId = init({ length: 12 });

    const routerHash = createId();

    const result = await dbExecute<{ id: string }>(
      `INSERT INTO routers (name, hash, organization_id) VALUES ($1, $2, $3) RETURNING id`,
      [name ?? "", routerHash, this.authParams.organizationId]
    );

    if (result.error || !result.data) {
      return err(`Failed to create router: ${result.error}`);
    }

    const routerId = result.data[0].id;

    const versionHash = crypto
      .createHash("sha256")
      .update(config ?? "{}")
      .digest("hex");
    const versionResult = await dbExecute<{ id: string }>(
      `INSERT INTO router_config_versions (router_id, version, config) VALUES ($1, $2, $3)`,
      [routerId, versionHash, config ?? "{}"]
    );
    if (versionResult.error || !versionResult.data) {
      return err(
        `Failed to create router config version: ${versionResult.error}`
      );
    }

    return ok({
      routerId,
      routerHash,
      routerVersionId: versionResult.data[0].id,
    });
  }

  async updateRouter(params: {
    id: string;
    name?: string;
    config?: string;
  }): Promise<Result<null, string>> {
    const { id, name, config } = params;

    const routerConfigResult = await dbExecute<{ id: string }>(
      `SELECT id FROM routers WHERE id = $1 AND organization_id = $2`,
      [id, this.authParams.organizationId]
    );
    if (routerConfigResult.error || !routerConfigResult.data) {
      return err(`Failed to get router: ${routerConfigResult.error}`);
    }

    if (name) {
      const nameResult = await dbExecute(
        `UPDATE routers SET name = $1 WHERE id = $2`,
        [name, id]
      );
      if (nameResult.error) {
        return err(`Failed to update router name: ${nameResult.error}`);
      }
    }

    const versionHash = crypto
      .createHash("sha256")
      .update(config ?? "{}")
      .digest("hex");
    const versionResult = await dbExecute(
      `INSERT INTO router_config_versions (router_id, version, config) VALUES ($1, $2, $3)`,
      [routerConfigResult.data[0].id, versionHash, config ?? "{}"]
    );
    if (versionResult.error) {
      return err(`Failed to update router: ${versionResult.error}`);
    }

    return ok(null);
  }
}
