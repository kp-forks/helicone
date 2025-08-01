import { Message } from "@helicone-package/llm-mapper/types";
import React from "react";
import { renderFunctionCall } from "./renderFunctionCall";
import MarkdownEditor from "@/components/shared/markdownEditor";
import { JsonRenderer } from "./JsonRenderer";

export const FunctionCall: React.FC<{ message: Message }> = ({ message }) => {
  if (Array.isArray(message.tool_calls) && message.tool_calls.length > 0) {
    return (
      <div className="flex flex-col space-y-2">
        {message.content !== null && message.content !== "" && (
          <div className="whitespace-pre-wrap text-xs font-semibold">
            {typeof message.content === "string" ? message.content : ""}
          </div>
        )}
        {message.tool_calls?.map((tool, index) =>
          tool.name && typeof tool.name === "string" ? (
            <pre
              key={index}
              className="overflow-auto whitespace-pre-wrap rounded-lg text-xs"
            >
              {tool.name}(<JsonRenderer data={tool.arguments} />)
            </pre>
          ) : null,
        )}
      </div>
    );
  } else if (Array.isArray(message.content)) {
    const toolUses = message.content.filter(
      (
        item,
      ): item is {
        type: "tool_use";
        name: string;
        input: Record<string, any>;
      } =>
        typeof item === "object" &&
        item !== null &&
        "type" in item &&
        item.type === "tool_use" &&
        "name" in item &&
        "input" in item,
    );
    return (
      <div className="flex flex-col space-y-2">
        {toolUses.map((tool, index) =>
          renderFunctionCall(tool.name, JSON.stringify(tool.input), index),
        )}
      </div>
    );
  }
  return (
    <div className="flex flex-col space-y-2">
      <MarkdownEditor
        language="markdown"
        text={typeof message.content === "string" ? message.content : ""}
        setText={() => {}}
        className=""
      />
    </div>
  );
};
