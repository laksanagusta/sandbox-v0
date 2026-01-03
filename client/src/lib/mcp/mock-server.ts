import { z } from "zod";

// --- Types ---

export interface Tool {
  name: string;
  description: string;
  inputSchema: any;
}

export interface McpServerResponse {
  result: {
    tools: Tool[];
  };
  jsonrpc: "2.0";
  id: number;
}

// --- Mock Data ---

const MOCK_EMAILS = [
  { sender: "boss@company.com", subject: "Urgent: Project Deadline", timestamp: "2026-01-02T09:00:00Z" },
  { sender: "newsletter@tech.com", subject: "Daily Tech Digest", timestamp: "2026-01-02T08:30:00Z" },
  { sender: "team@slack.com", subject: "New mentions in #general", timestamp: "2026-01-02T10:15:00Z" },
];

const MOCK_FILES = [
  { name: "Project Proposal.docx", type: "document", lastModified: "2026-01-02T11:00:00Z" },
  { name: "Q1 Budget.xlsx", type: "spreadsheet", lastModified: "2026-01-01T15:00:00Z" },
  { name: "Team Sync Deck.pptx", type: "presentation", lastModified: "2026-01-02T09:30:00Z" },
  { name: "Design Assets", type: "folder", lastModified: "2025-12-28T10:00:00Z" },
];

let MOCK_MEETINGS = [
  {
    id: "123456789",
    topic: "Weekly Standup",
    start_time: "2026-01-03T09:00:00Z",
    duration: 30,
    join_url: "https://zoom.us/j/123456789",
    password: "123",
  },
  {
    id: "987654321",
    topic: "Client Review",
    start_time: "2026-01-03T14:00:00Z",
    duration: 60,
    join_url: "https://zoom.us/j/987654321",
    password: "456",
  },
];

// --- Tool Definitions ---

export const TOOLS: Tool[] = [
  {
    name: "list_unread_emails_today",
    description: "List all unread Gmail messages received today. Returns sender, subject, and timestamp for each unread email received after the start of today in the local timezone.",
    inputSchema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "list_drive_files_by_type",
    description: "List Google Drive files of a specific type. Returns up to 20 files sorted by last modified time (most recent first). Supported types: document, spreadsheet, presentation, pdf, folder.",
    inputSchema: {
      type: "object",
      properties: {
        fileType: { type: "string", enum: ["document", "spreadsheet", "presentation", "pdf", "folder"], description: "The type of files to list" },
      },
      required: ["fileType"],
    },
  },
  {
    name: "summarize_drive_activity_today",
    description: "Provide a summary of Google Drive activity for today. Returns counts of files created and modified today, along with a list of affected files and their timestamps.",
    inputSchema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "list_zoom_meetings",
    description: "List all scheduled Zoom meetings. Returns meeting topic, ID, start time, duration, and join URL for each meeting.",
    inputSchema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "get_zoom_meeting",
    description: "Get details of a specific Zoom meeting by ID. Returns full meeting information including join URL, password, and settings.",
    inputSchema: {
      type: "object",
      properties: { meetingId: { type: "string", description: "The meeting ID to retrieve" } },
      required: ["meetingId"],
    },
  },
  {
    name: "create_zoom_meeting",
    description: "Create a new Zoom meeting. REQUIRES APPROVAL: First call returns a confirmation request. Call again with confirmed=true to execute. Parameters: topic (required), start_time (ISO 8601), duration (minutes), timezone, agenda, password.",
    inputSchema: {
      type: "object",
      properties: {
        topic: { type: "string", description: "Meeting topic/title (required)" },
        start_time: { type: "string", description: "Meeting start time in ISO 8601 format (e.g., 2024-01-15T10:00:00Z)" },
        duration: { type: "number", description: "Meeting duration in minutes (default: 60)" },
        timezone: { type: "string", description: "Timezone for the meeting (e.g., Asia/Jakarta)" },
        agenda: { type: "string", description: "Meeting agenda/description" },
        password: { type: "string", description: "Meeting password" },
        confirmed: { type: "boolean", description: "Set to true to confirm and execute the operation" },
      },
      required: ["topic"],
    },
  },
  {
    name: "update_zoom_meeting",
    description: "Update an existing Zoom meeting. REQUIRES APPROVAL: First call returns a confirmation request. Call again with confirmed=true to execute. Parameters: meetingId (required), and any fields to update (topic, start_time, duration, timezone, agenda, password).",
    inputSchema: {
      type: "object",
      properties: {
        meetingId: { type: "string", description: "The meeting ID to update (required)" },
        topic: { type: "string", description: "New meeting topic/title" },
        start_time: { type: "string", description: "New start time in ISO 8601 format" },
        duration: { type: "number", description: "New duration in minutes" },
        timezone: { type: "string", description: "New timezone" },
        agenda: { type: "string", description: "New meeting agenda/description" },
        password: { type: "string", description: "New meeting password" },
        confirmed: { type: "boolean", description: "Set to true to confirm and execute the operation" },
      },
      required: ["meetingId"],
    },
  },
  {
    name: "delete_zoom_meeting",
    description: "Delete a Zoom meeting. REQUIRES APPROVAL: First call returns a confirmation request. Call again with confirmed=true to execute.",
    inputSchema: {
      type: "object",
      properties: {
        meetingId: { type: "string", description: "The meeting ID to delete (required)" },
        confirmed: { type: "boolean", description: "Set to true to confirm and execute the deletion" },
      },
      required: ["meetingId"],
    },
  },
];

// --- Mock Handler ---

export async function executeMockTool(toolName: string, args: any): Promise<any> {
  console.log(`[MockServer] Executing ${toolName}`, args);
  await new Promise((resolve) => setTimeout(resolve, 800)); // Simulate network delay

  switch (toolName) {
    case "list_unread_emails_today":
      return MOCK_EMAILS;

    case "list_drive_files_by_type":
      return MOCK_FILES.filter((f) => f.type === args.fileType);

    case "summarize_drive_activity_today":
      return {
        created: 2,
        modified: 5,
        activity: MOCK_FILES.slice(0, 3),
      };

    case "list_zoom_meetings":
      return MOCK_MEETINGS;

    case "get_zoom_meeting":
      return MOCK_MEETINGS.find((m) => m.id === args.meetingId) || { error: "Meeting not found" };

    case "create_zoom_meeting":
      if (!args.confirmed) {
        return {
          status: "confirmation_required",
          message: `Please confirm you want to create a meeting: "${args.topic}"`,
          action: "create",
          params: args,
        };
      }
      const newMeeting = {
        id: Math.random().toString().slice(2, 11),
        topic: args.topic,
        start_time: args.start_time || new Date().toISOString(),
        duration: args.duration || 60,
        join_url: `https://zoom.us/j/${Math.random().toString().slice(2, 11)}`,
        password: args.password || "123456",
      };
      MOCK_MEETINGS.push(newMeeting);
      return { status: "success", meeting: newMeeting };

    case "update_zoom_meeting":
      if (!args.confirmed) {
         return {
          status: "confirmation_required",
          message: `Please confirm you want to update meeting ID: ${args.meetingId}`,
          action: "update",
          params: args,
        };
      }
      const index = MOCK_MEETINGS.findIndex((m) => m.id === args.meetingId);
      if (index === -1) return { error: "Meeting not found" };
      
      MOCK_MEETINGS[index] = { ...MOCK_MEETINGS[index], ...args };
      return { status: "success", meeting: MOCK_MEETINGS[index] };

    case "delete_zoom_meeting":
        if (!args.confirmed) {
         return {
          status: "confirmation_required",
          message: `Please confirm you want to DELETE meeting ID: ${args.meetingId}`,
          action: "delete",
          params: args,
        };
      }
      MOCK_MEETINGS = MOCK_MEETINGS.filter((m) => m.id !== args.meetingId);
      return { status: "success", message: "Meeting deleted" };

    default:
      throw new Error(`Tool ${toolName} not found`);
  }
}
