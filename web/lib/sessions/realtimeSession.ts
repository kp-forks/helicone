import { HeliconeRequest, Message } from "@helicone-package/llm-mapper/types";
import { heliconeRequestToMappedContent } from "@helicone-package/llm-mapper/utils/getMappedContent";
import { MappedLLMRequest } from "@helicone-package/llm-mapper/types";

// Given a mapped request, return a sorted array of "valid" messages.
// => Valid, for e.g messages that can be displayed as a row in Sessions, separately.
// => Invalid, e.g "session.update" messages, are not renderable steps. (though, I think it should be.)
// note: We should render session.update messages, its important information.
export const getSortedMessagesFromMappedRequest = (
  mappedRequest: MappedLLMRequest,
) => {
  const messages = [
    ...(mappedRequest.schema.request?.messages || []),
    ...(mappedRequest.schema.response?.messages || []),
  ];

  return messages
    .filter(
      (m) => m.timestamp && m.role && !isNaN(new Date(m.timestamp).getTime()),
    )
    .sort((a, b) => {
      return (
        new Date((a?.start_timestamp ?? a?.timestamp) || 0).getTime() -
        new Date((b?.start_timestamp ?? b?.timestamp) || 0).getTime()
      );
    });
};

/**
 * Checks if a HeliconeRequest represents a realtime session based on its model name.
 */
export const isRealtimeRequest = (request: HeliconeRequest): boolean => {
  if (!request) {
    return false;
  }
  const model = request.request_model || request.response_model || "";
  // Check if the model string contains "realtime"
  return model.toLowerCase().includes("realtime");
};

/**
 * Converts a single realtime HeliconeRequest into an array of simulated
 * HeliconeRequest objects, where each object represents a single message/step
 * in the realtime conversation. Ensures steps have sequential, non-overlapping timestamps.
 */
export const convertRealtimeRequestToSteps = (
  realtimeRequest: HeliconeRequest,
): HeliconeRequest[] => {
  if (!realtimeRequest) {
    return [];
  }

  const mappedContent = heliconeRequestToMappedContent(realtimeRequest);
  const sortedMessages = getSortedMessagesFromMappedRequest(mappedContent);

  const simulatedSteps: HeliconeRequest[] = [];
  let previousStepResponseTimestampMs = 0; // Track the end time of the last created step

  // Create a simulated request for each message
  sortedMessages.forEach((message, index) => {
    const step = createSimulatedRequestStep(
      realtimeRequest,
      message,
      index, // Pass the index of the message to highlight
      previousStepResponseTimestampMs, // Pass the end time of the previous step
    );
    simulatedSteps.push(step);
    // Update the tracker with the end time of the step we just created
    previousStepResponseTimestampMs = new Date(
      step.response_created_at!,
    ).getTime();
  });

  return simulatedSteps;
};

/**
 * Creates a simulated request step from a single message within a realtime request,
 * ensuring its start time is after the previous step's end time.
 * Each step retains the original request/response bodies but gets identifying properties.
 */
function createSimulatedRequestStep(
  originalRequest: HeliconeRequest,
  message: Message, // The specific message this step represents
  stepIndex: number, // The chronological index of this message/step
  _previousStepResponseTimestampMs: number, // The end time (in ms) of the preceding step
): HeliconeRequest {
  // Use the message timestamp as the base request time
  const baseRequestTimestampMs = new Date(
    message.start_timestamp ?? message.timestamp!,
  ).getTime();

  // Ensure the current step starts at least 1ms after the previous step ended
  const stepRequestTimestampMs = Math.max(baseRequestTimestampMs, 0);

  // Set response time 100ms after the (potentially adjusted) request time
  // Add a minimum duration of 1ms in case 100ms is too short due to adjustments
  const stepResponseTimestampMs = Math.max(
    stepRequestTimestampMs + 1,
    new Date(message.timestamp!).getTime(),
  );

  // Create a unique ID for the simulated step based on its index
  const simulatedId = `${originalRequest.request_id}-step-${stepIndex}`;

  const getMessagePath = (request: HeliconeRequest, message: Message) => {
    let base = request.request_properties?.["Helicone-Session-Path"];
    if (message._type === "functionCall" || message._type === "function") {
      return base ? base + "-Tool" : "/Tool";
    } else if (
      message.role === "user" ||
      message.role === "assistant" ||
      message.role === "system"
    ) {
      const role =
        message.role?.charAt(0).toUpperCase() + message.role?.slice(1);
      return base ? base + `-${role}` : `/${role}`;
    } else {
      return base ? base + "-Other" : "/Other";
    }
  };

  // Create the simulated request step object
  return {
    ...originalRequest, // Copy all base properties from the original request

    // Overwrite specific fields for the step
    request_id: simulatedId,
    request_created_at: new Date(stepRequestTimestampMs).toISOString(),
    response_created_at: new Date(stepResponseTimestampMs).toISOString(),

    // *** Use original request and response bodies ***
    // This ensures the mapper gets the full context it needs.
    request_body: originalRequest.request_body,
    response_body: originalRequest.response_body,

    request_path: getMessagePath(originalRequest, message),

    // Keep original token/cost/latency data from the parent request
    // These fields are already copied by the spread operator above

    // Add properties to identify this as a simulated step and its index
    // Merge with existing request_properties
    request_properties: {
      ...(originalRequest.request_properties || {}),
      "Helicone-Session-Path": getMessagePath(originalRequest, message),
      _helicone_realtime_original_request_id: originalRequest.request_id,
      _helicone_realtime_step_index: stepIndex.toString(), // Store the step's chronological index
    },
    // Ensure llmSchema is null for steps as it applies to the whole interaction
    llmSchema: null,
  };
}

// getEffectiveRequests is no longer needed as this logic will move to the page component.
