import { HeliconeTemplateManager } from "@helicone-package/prompts/templates";
import {
  HeliconeChatCreateParams,
  HeliconeChatCreateParamsStreaming,
} from "./prompts";
import {
  Prompt2025Version,
  ValidationError,
} from "@helicone-package/prompts/types";
import { ChatCompletionCreateParams } from "openai/resources/chat/completions";

interface HeliconePromptManagerOptions {
  apiKey: string;
  baseUrl?: string;
}

export class HeliconePromptManager {
  private apiKey: string;
  private baseUrl: string;

  constructor(options: HeliconePromptManagerOptions) {
    this.apiKey = options.apiKey;
    this.baseUrl = options.baseUrl || "https://api.helicone.ai";
  }

  /**
   * Pulls a prompt body from Helicone storage by prompt ID and optional version ID
   * @param promptId - The unique identifier of the prompt
   * @param versionId - Optional version ID, if not provided uses production version
   * @returns The raw prompt body from storage
   */
  async pullPromptBody(
    promptId: string,
    versionId?: string
  ): Promise<ChatCompletionCreateParams> {
    try {
      let versionId = "";
      if (!versionId) {
        const productionVersion = await this.getProductionVersion(promptId);
        versionId = productionVersion.id;
      }
      const promptVersion = await this.getPromptVersion(versionId);

      const promptBody = await this.fetchPromptBodyFromS3(
        promptVersion?.s3_url
      );
      return promptBody as ChatCompletionCreateParams;
    } catch (error) {
      console.error("Error pulling prompt body:", error);
      throw error;
    }
  }

  /**
   * Retrieves and merges prompt body with input parameters and variable substitution
   * @param params - The chat completion parameters containing prompt_id, optional version_id, inputs, and other OpenAI parameters
   * @returns Object containing the compiled prompt body and any validation/substitution errors
   */
  async getPromptBody(
    params: HeliconeChatCreateParams | HeliconeChatCreateParamsStreaming
  ): Promise<{ body: ChatCompletionCreateParams; errors: ValidationError[] }> {
    try {
      const errors: ValidationError[] = [];

      if (!params.prompt_id) {
        const { prompt_id, version_id, inputs, ...openaiParams } = params;
        return { body: openaiParams as ChatCompletionCreateParams, errors };
      }

      const pulledPromptBody = await this.pullPromptBody(
        params.prompt_id,
        params.version_id
      );

      const substitutionValues = params.inputs || {};

      const mergedMessages = [...pulledPromptBody.messages, ...params.messages];

      const substitutedMessages = mergedMessages.map((message) => {
        if (typeof message.content === "string") {
          const substituted = HeliconeTemplateManager.substituteVariables(
            message.content,
            substitutionValues
          );
          if (!substituted.success) {
            errors.push(...(substituted.errors || []));
          }
          return {
            ...message,
            content: substituted.success ? substituted.result : message.content,
          };
        }
        return message;
      });

      let finalResponseFormat = pulledPromptBody.response_format;
      if (finalResponseFormat) {
        const substitutedResponseFormat =
          HeliconeTemplateManager.substituteVariablesJSON(
            finalResponseFormat,
            substitutionValues
          );
        if (!substitutedResponseFormat.success) {
          errors.push(...(substitutedResponseFormat.errors || []));
        }
        finalResponseFormat = substitutedResponseFormat.success
          ? substitutedResponseFormat.result
          : finalResponseFormat;
      }

      let finalTools = pulledPromptBody.tools;
      if (finalTools) {
        const substitutedTools =
          HeliconeTemplateManager.substituteVariablesJSON(
            finalTools,
            substitutionValues
          );
        if (!substitutedTools.success) {
          errors.push(...(substitutedTools.errors || []));
        }
        finalTools = substitutedTools.success
          ? substitutedTools.result
          : finalTools;
      }

      const { prompt_id, version_id, inputs, ...inputOpenaiParams } = params;
      const mergedBody = {
        ...pulledPromptBody,
        ...inputOpenaiParams,
        messages: substitutedMessages,
        response_format: finalResponseFormat,
        tools: finalTools,
      } as ChatCompletionCreateParams;

      return { body: mergedBody, errors };
    } catch (error) {
      console.error("Error getting prompt body:", error);
      throw error;
    }
  }

  private async getPromptVersion(
    versionId: string
  ): Promise<Prompt2025Version> {
    const response = await fetch(
      `${this.baseUrl}/v1/prompt-2025/query/version`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          promptVersionId: versionId,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get prompt version: ${response.statusText}`);
    }

    const result = (await response.json()) as {
      data?: Prompt2025Version;
      error?: string;
    };
    if (result.error) {
      throw new Error(`API error: ${result.error}`);
    }

    return result.data as Prompt2025Version;
  }

  private async getProductionVersion(
    promptId: string
  ): Promise<Prompt2025Version> {
    const response = await fetch(
      `${this.baseUrl}/v1/prompt-2025/query/production-version`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          promptId: promptId,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(
        `Failed to get production version: ${response.statusText}`
      );
    }

    const result = (await response.json()) as {
      data?: Prompt2025Version;
      error?: string;
    };
    if (result.error) {
      throw new Error(`API error: ${result.error}`);
    }

    return result.data as Prompt2025Version;
  }

  private async fetchPromptBodyFromS3(s3Url?: string): Promise<any> {
    if (!s3Url) {
      throw new Error("No S3 URL provided for prompt body");
    }

    const response = await fetch(s3Url);

    if (!response.ok) {
      throw new Error(
        `Failed to fetch prompt body from S3: ${response.statusText}`
      );
    }

    return await response.json();
  }
}
