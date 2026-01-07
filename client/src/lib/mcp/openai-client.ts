// OpenAI chat is now proxied through the backend for security
// API key is stored on the server, not in the frontend

let isInitialized = false;
let cachedTools: any[] = [];

export type Message = {
  role: "user" | "assistant" | "system" | "tool";
  content: string | null;
  tool_calls?: any[];
  tool_call_id?: string;
  name?: string;
};

// Tools that require user confirmation before execution (destructive/write operations)
const TOOLS_REQUIRING_CONFIRMATION = [
  // Gmail
  "send_email",
  "create_email_draft",
  "trash_email",
  "delete_email",
  "add_label_to_email",
  "remove_label_from_email",
  // Drive
  "create_folder",
  "move_file",
  "rename_file",
  "copy_file",
  "share_file",
  "delete_file",
  // Calendar
  "create_calendar_event",
  "update_calendar_event",
  "delete_calendar_event",
  // Zoom
  "create_zoom_meeting",
  "update_zoom_meeting",
  "delete_zoom_meeting",
];

export type PendingToolCall = {
  id: string;
  toolName: string;
  toolArgs: any;
  description: string;
};

// Batch confirmation - can contain multiple tool calls
export type PendingConfirmation = {
  toolCalls: PendingToolCall[];
  summary: string; // e.g., "3 actions require confirmation"
};

export type ConfirmationCallback = (
  pendingConfirmation: PendingConfirmation
) => Promise<boolean>;

// Global confirmation callback - will be set by the UI component
let confirmationCallback: ConfirmationCallback | null = null;

export const setConfirmationCallback = (callback: ConfirmationCallback | null) => {
  confirmationCallback = callback;
};

// Get tool description from cached schema
function getToolSchemaDescription(toolName: string): string {
  const tool = cachedTools.find(t => t.name === toolName);
  return tool?.description || `Execute ${toolName}`;
}

// Fetch tools from the backend proxy
async function fetchTools() {
  if (cachedTools.length > 0) return cachedTools;
  try {
    const res = await fetch("/api/mcp/tools");
    const json = await res.json();
    // Support both direct array or { result: { tools: [...] } } structure
    const tools = json.result?.tools || json.tools || [];
    cachedTools = tools;
    return tools;
  } catch (err) {
    console.error("Failed to fetch tools:", err);
    return [];
  }
}

// Execute tool via backend proxy
async function executeTool(name: string, args: any) {
  const res = await fetch("/api/mcp/execute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, arguments: args }),
  });
  const json = await res.json();
  
  // Unwrap if wrapped in { result: ... } or just return the body
  if (json.error) throw new Error(json.error.message || json.error);
  return json.content?.[0]?.text ? JSON.parse(json.content[0].text) : json;
}

/**
 * Generates a system prompt with current date/time context.
 * This helps the LLM correctly interpret relative dates like "tomorrow", "next week", etc.
 */
function getSystemPrompt(): Message {
  const now = new Date();
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'Asia/Jakarta',
    timeZoneName: 'short'
  };
  const formattedDate = now.toLocaleString('en-US', options);
  const isoDate = now.toISOString();
  
  // Also provide tomorrow's date for convenience
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowISO = tomorrow.toISOString().split('T')[0];

  return {
    role: "system",
    content: `You are a helpful AI assistant that can manage Gmail, Google Drive, Google Calendar, and Zoom meetings.

IMPORTANT - Current Date and Time Context:
- Current datetime: ${formattedDate}
- ISO format: ${isoDate}
- Tomorrow's date: ${tomorrowISO}
- Timezone: Asia/Jakarta (UTC+7)

When the user mentions relative dates like "today", "tomorrow", "next week", "besok" (Indonesian for tomorrow), etc., you MUST calculate the correct date based on the current date above.

For calendar events and meetings, always use ISO 8601 format with timezone offset, e.g.: ${now.getFullYear()}-01-15T10:00:00+07:00

CRITICAL - Parameter Clarification Rules:
Before calling any tool (especially write/create/update/delete operations), you MUST ensure all required information is provided. If the user's request is missing important details, ASK FOR CLARIFICATION FIRST. Do NOT make assumptions or use placeholder values.

General Rules:
1. If ANY required parameter is unclear or missing, ask the user before proceeding
2. Do NOT use generic placeholders like "Meeting", "Untitled", "New Event" - ask the user instead
3. For write operations, always confirm your understanding of the request before executing
4. Be proactive in asking clarifying questions - it's better to ask than to create something wrong

Be helpful, concise, and accurate. When calling tools, ensure all parameters are explicitly provided by the user or confirmed through clarification.`
  };
}

export const sendMessage = async (
  messages: Message[],
  onToolCall?: (toolName: string, args: any) => void
): Promise<Message[]> => {
  // Ensure tools are loaded
  const tools = await fetchTools();

  // Prepend system message with current date context if not already present
  const systemMessage = getSystemPrompt();
  const hasSystemMessage = messages.some(m => m.role === "system");
  const messagesWithSystem = hasSystemMessage 
    ? messages.map(m => m.role === "system" ? systemMessage : m) // Update existing system message
    : [systemMessage, ...messages]; // Add new system message

  // Format tools for OpenAI
  const formattedTools = tools.length > 0 ? tools.map((t: any) => ({
    type: "function" as const,
    function: {
      name: t.name,
      description: t.description,
      parameters: t.inputSchema,
    },
  })) : undefined;

  // 1. Send user message to LLM via backend proxy
  const chatResponse = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: messagesWithSystem,
      tools: formattedTools,
    }),
  });

  if (!chatResponse.ok) {
    const errorData = await chatResponse.json();
    throw new Error(errorData.error || "Failed to get response from chat API");
  }

  const completion = await chatResponse.json();
  const responseMessage = completion.choices[0].message;
  
  const assistantMsg: Message = {
    role: "assistant",
    content: responseMessage.content,
    tool_calls: responseMessage.tool_calls,
  };

  const newHistory = [...messagesWithSystem, assistantMsg];

  // 2. Check if tool calls are required
  if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
    // Parse all tool calls first
    const parsedToolCalls = responseMessage.tool_calls.map((tc: any) => ({
      id: tc.id,
      toolName: tc.function.name,
      toolArgs: JSON.parse(tc.function.arguments),
    }));

    // Separate tool calls that need confirmation vs those that don't
    const toolsNeedingConfirmation = parsedToolCalls.filter(
      (tc: any) => TOOLS_REQUIRING_CONFIRMATION.includes(tc.toolName)
    );

    // If any tools need confirmation, ask once for all of them
    let shouldExecuteConfirmationTools = true;
    
    if (toolsNeedingConfirmation.length > 0 && confirmationCallback) {
      const pendingCalls: PendingToolCall[] = toolsNeedingConfirmation.map((tc: any) => ({
        id: tc.id,
        toolName: tc.toolName,
        toolArgs: tc.toolArgs,
        description: getToolSchemaDescription(tc.toolName),
      }));

      const summary = toolsNeedingConfirmation.length === 1
        ? `1 action requires confirmation`
        : `${toolsNeedingConfirmation.length} actions require confirmation`;

      const pendingConfirmation: PendingConfirmation = {
        toolCalls: pendingCalls,
        summary,
      };

      // Wait for user confirmation (single confirmation for all)
      shouldExecuteConfirmationTools = await confirmationCallback(pendingConfirmation);
    }

    // Execute all tool calls
    for (const tc of parsedToolCalls) {
      if (onToolCall) {
        onToolCall(tc.toolName, tc.toolArgs);
      }

      const needsConfirmation = TOOLS_REQUIRING_CONFIRMATION.includes(tc.toolName);
      const shouldExecute = needsConfirmation ? shouldExecuteConfirmationTools : true;

      let toolResult;
      
      if (shouldExecute) {
        // Execute the tool (Via Backend Proxy)
        try {
          // For tools requiring confirmation, auto-inject confirmed=true
          // since the UI already handled the confirmation
          const argsWithConfirmation = needsConfirmation 
            ? { ...tc.toolArgs, confirmed: true }
            : tc.toolArgs;
          toolResult = await executeTool(tc.toolName, argsWithConfirmation);
        } catch (error: any) {
          toolResult = { error: error.message };
        }
      } else {
        // User cancelled the action
        toolResult = { 
          cancelled: true, 
          message: "Action was cancelled by user" 
        };
      }

      // Add tool result to history
      newHistory.push({
        // @ts-ignore
        role: "tool", 
        content: JSON.stringify(toolResult),
        tool_call_id: tc.id,
      });
    }

    // 3. Follow up with LLM after tool execution via backend proxy
    const followUpResponse = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: newHistory,
      }),
    });

    if (!followUpResponse.ok) {
      const errorData = await followUpResponse.json();
      throw new Error(errorData.error || "Failed to get follow-up response");
    }

    const followUp = await followUpResponse.json();

    newHistory.push({
        role: "assistant",
        content: followUp.choices[0].message.content
    });
  }

  return newHistory;
};
