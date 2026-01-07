import OpenAI from "openai";

// In a real app, this should be an env variable or user input.
// For this demo, we can ask the user to input it in the UI.
let openaiInstance: OpenAI | null = null;
let cachedTools: any[] = [];

export const initializeOpenAI = (apiKey: string) => {
  openaiInstance = new OpenAI({
    apiKey: apiKey,
    dangerouslyAllowBrowser: true, // Specific for client-side demo
  });
};

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
    content: `You are a helpful AI assistant that can manage Gmail, Google Drive, and Google Calendar.

IMPORTANT - Current Date and Time Context:
- Current datetime: ${formattedDate}
- ISO format: ${isoDate}
- Timezone: Asia/Jakarta (UTC+7)

When the user mentions relative dates like "today", "tomorrow", "next week", "besok" (Indonesian for tomorrow), etc., you MUST calculate the correct date based on the current date above.

For calendar events, always use ISO 8601 format with timezone offset, e.g.: ${now.getFullYear()}-01-15T10:00:00+07:00

Be helpful, concise, and accurate. When calling tools, ensure all date/time parameters are correct based on the current context.`
  };
}

export const sendMessage = async (
  messages: Message[],
  onToolCall?: (toolName: string, args: any) => void
): Promise<Message[]> => {
  if (!openaiInstance) {
    throw new Error("OpenAI API Key not initialized");
  }

  // Ensure tools are loaded
  const tools = await fetchTools();

  // Prepend system message with current date context if not already present
  const systemMessage = getSystemPrompt();
  const hasSystemMessage = messages.some(m => m.role === "system");
  const messagesWithSystem = hasSystemMessage 
    ? messages.map(m => m.role === "system" ? systemMessage : m) // Update existing system message
    : [systemMessage, ...messages]; // Add new system message

  // 1. Send user message to LLM
  const completion = await openaiInstance.chat.completions.create({
    messages: messagesWithSystem as any,
    model: "gpt-4o-mini",
    tools: tools.length > 0 ? tools.map((t: any) => ({
      type: "function",
      function: {
        name: t.name,
        description: t.description,
        parameters: t.inputSchema,
      },
    })) : undefined,
  });

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
      tc => TOOLS_REQUIRING_CONFIRMATION.includes(tc.toolName)
    );
    const toolsNotNeedingConfirmation = parsedToolCalls.filter(
      tc => !TOOLS_REQUIRING_CONFIRMATION.includes(tc.toolName)
    );

    // If any tools need confirmation, ask once for all of them
    let shouldExecuteConfirmationTools = true;
    
    if (toolsNeedingConfirmation.length > 0 && confirmationCallback) {
      const pendingCalls: PendingToolCall[] = toolsNeedingConfirmation.map(tc => ({
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
          toolResult = await executeTool(tc.toolName, tc.toolArgs);
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

    // 3. Follow up with LLM after tool execution
    const followUp = await openaiInstance.chat.completions.create({
        messages: newHistory as any,
        model: "gpt-4o-mini",
    });

    newHistory.push({
        role: "assistant",
        content: followUp.choices[0].message.content
    });
  }

  return newHistory;
};
