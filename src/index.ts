import process from "node:process";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
  McpError,
  ErrorCode
} from "@modelcontextprotocol/sdk/types.js";
import { SUPER_INSTRUCTION } from "./prompts.js";

// Mitigated Operational Vulnerability 1: Context Degradation (Lost in the Middle)
// We lower the limit to 10,000 to ensure the LLM does not lose attention on the 9 pillars
const MAX_PAYLOAD_SIZE = 10000;

let isReady = false;
let isConnecting = false;
let activeRequests = 0;

const server = new Server(
  {
    name: "defensive-logical-auditor",
    version: "1.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

const FULL_AUDIT_TOOL: Tool = {
  name: "full_audit",
  description: "9-pillar logical audit with over-engineering prevention.",
  inputSchema: {
    type: "object",
    properties: {
      code_snippet: {
        type: "string",
        description: "The source code to be evaluated."
      },
      risk_level: {
        type: "string",
        enum: ["auto", "low", "medium", "critical"],
        description: "Requested risk level. 'auto' lets the LLM infer if it requires heavy shields. 'critical' forces stress simulation."
      }
    },
    required: ["code_snippet"]
  }
};

server.setRequestHandler(ListToolsRequestSchema, async () => {
  if (!isReady) throw new McpError(ErrorCode.InternalError, "The server is not ready yet.");
  return { tools: [FULL_AUDIT_TOOL] };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (!isReady) throw new McpError(ErrorCode.InternalError, "The server is shutting down or not ready.");
  
  activeRequests++;
  try {
    if (request.params.name === "full_audit") {
      const codeSnippet = request.params.arguments?.code_snippet as string;
      const riskLevel = (request.params.arguments?.risk_level as string) || "auto";
      
      if (typeof codeSnippet !== "string" || codeSnippet.trim() === "") {
        throw new McpError(ErrorCode.InvalidParams, "'code_snippet' must be valid text.");
      }

      if (codeSnippet.length > MAX_PAYLOAD_SIZE) {
        throw new McpError(
          ErrorCode.InvalidParams, 
          `Context Degradation Error: Code exceeds ${MAX_PAYLOAD_SIZE} characters. Break down the code and audit component by component to preserve logical precision.`
        );
      }

      const sanitizeMap: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;" };
      const sanitizedSnippet = codeSnippet.replace(/[&<>]/g, (match) => sanitizeMap[match]);

      const responseText = `${SUPER_INSTRUCTION}\n\n<execution_parameters>\nREQUESTED_RISK_LEVEL: ${riskLevel}\n</execution_parameters>\n\n<user_code>\n${sanitizedSnippet}\n</user_code>\n\nExecute the protocol now.`;

      return {
        content: [{ type: "text", text: responseText }]
      };
    }

    throw new McpError(ErrorCode.MethodNotFound, `Tool not found: ${request.params.name}`);
  } finally {
    activeRequests--;
  }
});

async function run() {
  if (isConnecting || isReady) return;
  isConnecting = true;

  const transport = new StdioServerTransport();
  let timeoutId: NodeJS.Timeout | undefined;

  try {
    await Promise.race([
      server.connect(transport),
      new Promise((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error("Timeout connecting to stdio")), 5000);
      })
    ]);
    if (timeoutId) clearTimeout(timeoutId);
    
    isReady = true;
    console.error("Defensive Logical Auditor MCP Server running on stdio");
  } catch (error) {
    if (timeoutId) clearTimeout(timeoutId);
    console.error("Initialization failed:", error);
    try { await server.close(); } catch (e) {}
    process.exit(1);
  } finally {
    isConnecting = false;
  }
}

async function shutdown() {
  if (!isReady) process.exit(0);
  console.error("\nInitiating graceful shutdown...");
  isReady = false; 

  const forceShutdownTimeout = setTimeout(() => process.exit(1), 15000);

  while (activeRequests > 0) {
    await new Promise(r => setTimeout(r, 100));
  }

  clearTimeout(forceShutdownTimeout);
  try { await server.close(); } catch (e) {}
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown); 

run().catch(() => process.exit(1));
