// src/users/usersController.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Path,
  Post,
  Query,
  Request,
  Route,
  Security,
  Tags,
} from "tsoa";
import { Result } from "../../packages/common/result";
import { Prompt2025Manager } from "../../managers/prompt/PromptManager";
import type { JawnAuthenticatedRequest } from "../../types/request";
import { type OpenAIChatRequest } from "@helicone-package/llm-mapper/mappers/openai/chat-v2";
import { Prompt2025Version, Prompt2025, Prompt2025Input } from "@helicone-package/prompts/types";

export interface PromptCreateResponse {
  id: string;
  versionId: string;
}

export interface PromptVersionCounts {
  totalVersions: number;
  majorVersions: number;
}


// TODO: Delete old promptController and rename this to promptController
@Route("v1/prompt-2025")
@Tags("Prompt2025")
@Security("api_key")
export class Prompt2025Controller extends Controller {
  // Unsure why id/ is here, it is not RESTFUL. But there is a reason for it.
  @Get("id/{promptId}")
  public async getPrompt2025(
    @Path() promptId: string,
    @Request() request: JawnAuthenticatedRequest,
  ): Promise<Result<Prompt2025, string>> {
    const promptManager = new Prompt2025Manager(request.authParams);
    const result = await promptManager.getPrompt(promptId);
    if (result.error || !result.data) {
      this.setStatus(500);
    } else {
      this.setStatus(200);
    }
    return result;
  }

  @Post("id/{promptId}/rename")
  public async renamePrompt2025(
    @Path() promptId: string,
    @Body() requestBody: {
      name: string;
    },
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<null, string>> {
    const promptManager = new Prompt2025Manager(request.authParams);
    const result = await promptManager.renamePrompt({ promptId, name: requestBody.name });
    if (result.error) {
      this.setStatus(500);
    } else {
      this.setStatus(200);
    }
    return result;
  }

  @Delete("{promptId}")
  public async deletePrompt2025(
    @Path() promptId: string,
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<null, string>> {
    const promptManager = new Prompt2025Manager(request.authParams);
    const result = await promptManager.deletePrompt({ promptId });
    if (result.error) {
      this.setStatus(500);
    } else {
      this.setStatus(200);
    }
    return result;
  }

  @Delete("{promptId}/{versionId}")
  public async deletePrompt2025Version(
    @Path() promptId: string,
    @Path() versionId: string,
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<null, string>> {
    const promptManager = new Prompt2025Manager(request.authParams);
    const result = await promptManager.deletePromptVersion({ promptId, promptVersionId: versionId });
    if (result.error) {
      this.setStatus(500);
    } else {
      this.setStatus(200);
    }
    return result;
  }

  @Get("id/{promptId}/{versionId}/inputs")
  public async getPrompt2025Inputs(
    @Path() promptId: string,
    @Path() versionId: string,
    @Query() requestId: string,
    @Request() request: JawnAuthenticatedRequest,
  ): Promise<Result<Prompt2025Input, string>> {
    const promptManager = new Prompt2025Manager(request.authParams);
    const result = await promptManager.getPromptInputs({ promptId, versionId, requestId });
    if (result.error) {
      this.setStatus(500);
      return result;
    }
    if (!result.data) {
      this.setStatus(404);
      return { error: "Prompt inputs not found", data: null };
    }
    this.setStatus(200);
    return { error: null, data: result.data };
  }

  @Get("tags")
  public async getPrompt2025Tags(
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<string[], string>> {
    const promptManager = new Prompt2025Manager(request.authParams);
    const result = await promptManager.getPromptTags();
    if (result.error || !result.data) {
      this.setStatus(500);
    } else {
      this.setStatus(200);
    }
    return result;
  }

  @Post("")
  public async createPrompt2025(
    @Body()
    requestBody: {
      name: string;
      tags: string[];
      promptBody: OpenAIChatRequest;
    },
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<PromptCreateResponse, string>> {
    const promptManager = new Prompt2025Manager(request.authParams);

    const result = await promptManager.createPrompt(requestBody);
    if (result.error || !result.data) {
      this.setStatus(500);
    } else {
      this.setStatus(201); // set return status 201
    }
    return result;
  }

  @Post("update")
  public async updatePrompt2025(
    @Body()
    requestBody: {
      promptId: string;
      promptVersionId: string;
      newMajorVersion: boolean;
      setAsProduction: boolean;
      commitMessage: string;
      promptBody: OpenAIChatRequest;
    },
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<{ id: string }, string>> {
    const promptManager = new Prompt2025Manager(request.authParams);

    const result = await promptManager.newPromptVersion(requestBody);
    if (result.error || !result.data) {
      this.setStatus(500);
    } else {
      this.setStatus(200);
    }
    return result;
  }

  @Post("update/production-version")
  public async setProductionVersion(
    @Body()
    requestBody: {
      promptId: string;
      promptVersionId: string;
    },
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<null, string>> {
    const promptManager = new Prompt2025Manager(request.authParams);
    const result = await promptManager.setProductionVersion({
      promptId: requestBody.promptId,
      promptVersionId: requestBody.promptVersionId,
    });
    if (result.error) {
      this.setStatus(500);
    } else {
      this.setStatus(200);
    }
    return result;
  }
  
  @Get("count")
  public async getPrompt2025Count(
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<number, string>> {
    const promptManager = new Prompt2025Manager(request.authParams);
    const result = await promptManager.totalPrompts();
    if (result.error || !result.data) {
      this.setStatus(500);
    } else {
      this.setStatus(200);
    }
    return result;
  }

  @Post("query")
  public async getPrompts2025(
    @Body()
    requestBody: {
      search: string;
      tagsFilter: string[];
      page: number;
      pageSize: number;
    },
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<Prompt2025[], string>> {
    const promptManager = new Prompt2025Manager(request.authParams);
    const result = await promptManager.getPrompts(requestBody);
    if (result.error || !result.data) {
      this.setStatus(500);
    } else {
      this.setStatus(200); // set return status 201
    }
    return result;
  }

  @Post("query/version")
  public async getPrompt2025Version(
    @Body()
    requestBody: {
      promptVersionId: string;
    },
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<Prompt2025Version, string>> {
    const promptManager = new Prompt2025Manager(request.authParams);
    const result = await promptManager.getPromptVersionWithBody(requestBody);
    if (result.error || !result.data) {
      this.setStatus(500);
    } else {
      this.setStatus(200);
    }
    return result;
  }

  @Post("query/versions")
  public async getPrompt2025Versions(
    @Body()
    requestBody: {
      promptId: string;
      majorVersion?: number;
    },
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<Prompt2025Version[], string>> {
    const promptManager = new Prompt2025Manager(request.authParams);

    const result = await promptManager.getPromptVersions(requestBody);
    if (result.error || !result.data) {
      this.setStatus(500);
    } else {
      this.setStatus(200);
    }
    return result;
  }

  @Post("query/production-version")
  public async getPrompt2025ProductionVersion(
    @Body()
    requestBody: {
      promptId: string;
    },
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<Prompt2025Version, string>> {
    const promptManager = new Prompt2025Manager(request.authParams);
    const result = await promptManager.getPromptProductionVersion(requestBody);
    if (result.error || !result.data) {
      this.setStatus(500);
    } else {
      this.setStatus(200);
    }
    return result;
  }

  @Post("query/total-versions")
  public async getPrompt2025TotalVersions(
    @Body()
    requestBody: {
      promptId: string;
    },
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<PromptVersionCounts, string>> {

    const promptManager = new Prompt2025Manager(request.authParams);

    const result = await promptManager.getPromptVersionCounts(requestBody);
    if (result.error || !result.data) {
      this.setStatus(500);
    } else {
      this.setStatus(200);
    }
    return result;
  }
}