/**
 * MCP HTTP Client Runner
 * 
 * Connects to MCP server via HTTP/SSE for production deployment.
 * Falls back to stdio for local development.
 */

// Configuration from environment
const MCP_SERVER_URL = process.env.MCP_SERVER_URL || 'http://localhost:3003';
const USE_HTTP_TRANSPORT = process.env.MCP_TRANSPORT === 'http' || !!process.env.MCP_SERVER_URL;

interface JsonRpcMessage {
  jsonrpc: "2.0";
  id?: number | string;
  method?: string;
  params?: any;
  result?: any;
  error?: any;
}

interface McpTool {
  name: string;
  description: string;
  inputSchema: any;
}

interface ToolCallResult {
  content: Array<{
    type: string;
    text: string;
  }>;
  isError?: boolean;
}

/**
 * HTTP-based MCP Client for production
 */
class HttpMcpClient {
  private baseUrl: string;
  private requestId = 0;
  private initialized = false;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    console.log(`[MCP HTTP Client] Configured for ${baseUrl}`);
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Send initialize request
      const initResult = await this.callMethod("initialize", {
        protocolVersion: "2024-11-05",
        capabilities: {},
        clientInfo: {
          name: "sandbox-mcp-client",
          version: "1.0.0",
        },
      });
      console.log("[MCP HTTP Client] Initialized:", initResult);

      // Send initialized notification
      await this.callMethod("notifications/initialized");
      this.initialized = true;
    } catch (error) {
      console.error("[MCP HTTP Client] Initialize failed:", error);
      throw error;
    }
  }

  private async callMethod(method: string, params?: any): Promise<any> {
    const id = this.requestId++;
    const request: JsonRpcMessage = {
      jsonrpc: "2.0",
      id,
      method,
      params,
    };

    try {
      const response = await fetch(`${this.baseUrl}/mcp/message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status} ${response.statusText}`);
      }

      const data: JsonRpcMessage = await response.json();

      if (data.error) {
        throw new Error(data.error.message);
      }

      return data.result;
    } catch (error: any) {
      console.error(`[MCP HTTP Client] Error calling ${method}:`, error.message);
      throw error;
    }
  }

  async listTools(): Promise<{ tools: McpTool[] }> {
    await this.initialize();
    return this.callMethod("tools/list");
  }

  async callTool(name: string, args: any): Promise<ToolCallResult> {
    await this.initialize();
    return this.callMethod("tools/call", { name, arguments: args });
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/mcp/health`);
      return response.ok;
    } catch {
      return false;
    }
  }
}

/**
 * Stdio-based MCP Client for local development
 */
import { spawn, ChildProcess } from "child_process";

// Configuration for stdio mode
const MCP_SERVER_PATH = process.env.MCP_SERVER_PATH || "/Users/dikalaksana/Engineering/mcp-server/dist/index.js";
const MCP_SERVER_CWD = process.env.MCP_SERVER_CWD || "/Users/dikalaksana/Engineering/mcp-server";

class StdioMcpClient {
  private child: ChildProcess | null = null;
  private requestId = 0;
  private pendingRequests: Map<number | string, { resolve: (value: any) => void; reject: (reason?: any) => void }> = new Map();
  private buffer = "";
  private initialized = false;

  constructor() {
    this.start();
  }

  private async start() {
    console.log(`[MCP Stdio Client] Spawning server at ${MCP_SERVER_PATH}`);

    this.child = spawn("node", [MCP_SERVER_PATH], {
      cwd: MCP_SERVER_CWD,
      env: { ...process.env, PATH: process.env.PATH },
      stdio: ["pipe", "pipe", "pipe"],
    });

    this.child.stdout?.on("data", (data) => {
      this.handleData(data.toString());
    });

    this.child.stderr?.on("data", (data) => {
      console.error(`[MCP Server Stderr] ${data}`);
    });

    this.child.on("close", (code) => {
      console.log(`[MCP Stdio Client] Server exited with code ${code}`);
      this.child = null;
      this.initialized = false;
    });

    this.child.on("error", (err) => {
      console.error(`[MCP Stdio Client] Process error:`, err);
    });

    // Send MCP initialize handshake
    try {
      await this.initialize();
    } catch (err) {
      console.error("[MCP Stdio Client] Initialize failed:", err);
    }
  }

  private async initialize() {
    const result = await this.callMethod("initialize", {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: {
        name: "sandbox-mcp-client",
        version: "1.0.0",
      },
    });
    console.log("[MCP Stdio Client] Initialized:", result);

    // Send initialized notification
    this.sendNotification("notifications/initialized");
    this.initialized = true;
  }

  private sendNotification(method: string, params?: any) {
    if (!this.child) return;
    const notification: JsonRpcMessage = {
      jsonrpc: "2.0",
      method,
      params,
    };
    this.child.stdin?.write(JSON.stringify(notification) + "\n");
  }

  private handleData(chunk: string) {
    this.buffer += chunk;

    const lines = this.buffer.split("\n");
    this.buffer = lines.pop() || "";

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const message: JsonRpcMessage = JSON.parse(line);
        this.handleMessage(message);
      } catch (e) {
        console.warn(`[MCP Stdio Client] Failed to parse JSON: ${line.substring(0, 100)}...`);
      }
    }
  }

  private handleMessage(message: JsonRpcMessage) {
    if (message.id !== undefined && (message.result !== undefined || message.error !== undefined)) {
      const handler = this.pendingRequests.get(message.id);
      if (handler) {
        if (message.error) {
          handler.reject(message.error);
        } else {
          handler.resolve(message.result);
        }
        this.pendingRequests.delete(message.id);
      }
    } else {
      console.log("[MCP Stdio Client] Received notification:", message);
    }
  }

  public async callMethod(method: string, params?: any): Promise<any> {
    if (!this.child) {
      await this.start();
      if (!this.child) throw new Error("MCP Server not running");
    }

    const id = this.requestId++;
    const request: JsonRpcMessage = {
      jsonrpc: "2.0",
      id,
      method,
      params,
    };

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error("Timeout waiting for MCP response"));
        }
      }, 30000);

      this.pendingRequests.set(id, {
        resolve: (res: any) => {
          clearTimeout(timeout);
          resolve(res);
        },
        reject: (err: any) => {
          clearTimeout(timeout);
          reject(err);
        },
      });

      try {
        const msgStr = JSON.stringify(request) + "\n";
        this.child!.stdin?.write(msgStr);
      } catch (e) {
        clearTimeout(timeout);
        this.pendingRequests.delete(id);
        reject(e);
      }
    });
  }

  public async listTools(): Promise<{ tools: McpTool[] }> {
    return this.callMethod("tools/list");
  }

  public async callTool(name: string, args: any): Promise<ToolCallResult> {
    return this.callMethod("tools/call", { name, arguments: args });
  }
}

/**
 * MCP Runner - Factory for selecting the appropriate client
 */
export class McpRunner {
  private httpClient: HttpMcpClient | null = null;
  private stdioClient: StdioMcpClient | null = null;
  private useHttp: boolean;

  constructor() {
    this.useHttp = USE_HTTP_TRANSPORT;
    console.log(`[MCP Runner] Using ${this.useHttp ? 'HTTP' : 'stdio'} transport`);

    if (this.useHttp) {
      this.httpClient = new HttpMcpClient(MCP_SERVER_URL);
    } else {
      this.stdioClient = new StdioMcpClient();
    }
  }

  public async listTools(): Promise<{ tools: McpTool[] }> {
    if (this.useHttp && this.httpClient) {
      return this.httpClient.listTools();
    } else if (this.stdioClient) {
      return this.stdioClient.listTools();
    }
    throw new Error("No MCP client available");
  }

  public async callTool(name: string, args: any): Promise<ToolCallResult> {
    if (this.useHttp && this.httpClient) {
      return this.httpClient.callTool(name, args);
    } else if (this.stdioClient) {
      return this.stdioClient.callTool(name, args);
    }
    throw new Error("No MCP client available");
  }

  public async healthCheck(): Promise<boolean> {
    if (this.useHttp && this.httpClient) {
      return this.httpClient.healthCheck();
    }
    // For stdio, just check if process is running
    return true;
  }
}

// Singleton instance
export const mcpRunner = new McpRunner();
