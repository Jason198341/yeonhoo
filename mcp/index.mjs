#!/usr/bin/env node
/**
 * Yeonhoo MCP Server
 * Lets Claude control Yeonhoo terminal panes via local HTTP API (port 7777)
 *
 * Tools:
 *   list_panes    — list all open terminal pane IDs
 *   run_command   — run a shell command in a specific pane (sends text + Enter)
 *   get_output    — retrieve output accumulated since last call (then clears buffer)
 *   send_input    — send raw text to a pane (no Enter, for interactive prompts)
 *   wait_and_get  — sleep N ms then get_output (convenience for async commands)
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const API = "http://127.0.0.1:7777";

async function api(path, options = {}) {
  const res = await fetch(`${API}${path}`, options);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${path} → ${res.status}: ${text}`);
  }
  return res.json();
}

// ── Tool definitions ──────────────────────────────────────────────────────────

const TOOLS = [
  {
    name: "list_panes",
    description:
      "List all currently open terminal pane IDs in Yeonhoo. Call this first to get pane IDs.",
    inputSchema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "run_command",
    description:
      "Run a shell command in a Yeonhoo terminal pane. Sends the command text followed by Enter (\\r). " +
      "Use get_output or wait_and_get afterward to read the result.",
    inputSchema: {
      type: "object",
      properties: {
        pane_id: {
          type: "string",
          description: "The pane ID returned by list_panes",
        },
        command: {
          type: "string",
          description: "Shell command to execute, e.g. 'npm run build'",
        },
      },
      required: ["pane_id", "command"],
    },
  },
  {
    name: "get_output",
    description:
      "Get all terminal output accumulated since the last call for this pane (buffer is cleared after reading). " +
      "Returns raw terminal text including ANSI escape codes.",
    inputSchema: {
      type: "object",
      properties: {
        pane_id: {
          type: "string",
          description: "The pane ID returned by list_panes",
        },
      },
      required: ["pane_id"],
    },
  },
  {
    name: "send_input",
    description:
      "Send raw text to a pane without adding Enter. Useful for answering interactive prompts (y/n, passwords, etc.).",
    inputSchema: {
      type: "object",
      properties: {
        pane_id: { type: "string" },
        text: {
          type: "string",
          description: "Raw text to send. Use \\r for Enter, \\x03 for Ctrl+C.",
        },
      },
      required: ["pane_id", "text"],
    },
  },
  {
    name: "wait_and_get",
    description:
      "Wait a given number of milliseconds then return accumulated output. " +
      "Use after run_command to give the command time to finish. Default wait: 3000ms.",
    inputSchema: {
      type: "object",
      properties: {
        pane_id: { type: "string" },
        wait_ms: {
          type: "number",
          description: "Milliseconds to wait before reading output (default 3000)",
        },
      },
      required: ["pane_id"],
    },
  },
];

// ── Tool handlers ─────────────────────────────────────────────────────────────

async function handleTool(name, args) {
  switch (name) {
    case "list_panes": {
      const panes = await api("/panes");
      if (panes.length === 0) {
        return "No panes open. Please open Yeonhoo and create at least one terminal pane.";
      }
      return panes.map((p) => p.id).join("\n");
    }

    case "run_command": {
      const { pane_id, command } = args;
      await api(`/panes/${pane_id}/input`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: command + "\r" }),
      });
      return `Command sent to pane ${pane_id}: ${command}\nUse wait_and_get to read the output.`;
    }

    case "get_output": {
      const { pane_id } = args;
      const result = await api(`/panes/${pane_id}/output`);
      const out = result.output;
      if (!out) return "(no output buffered)";
      // Strip ANSI escape codes for readability
      return stripAnsi(out);
    }

    case "send_input": {
      const { pane_id, text } = args;
      await api(`/panes/${pane_id}/input`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      return `Input sent to pane ${pane_id}.`;
    }

    case "wait_and_get": {
      const { pane_id, wait_ms = 3000 } = args;
      await new Promise((r) => setTimeout(r, wait_ms));
      const result = await api(`/panes/${pane_id}/output`);
      const out = result.output;
      if (!out) return "(no output after waiting)";
      return stripAnsi(out);
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

// ── ANSI stripper ─────────────────────────────────────────────────────────────

function stripAnsi(str) {
  // Remove ESC sequences and control chars, keep readable text
  return str
    .replace(/\x1b\[[0-9;]*[mGKHFABCDEJsuhr]/g, "")
    .replace(/\x1b\][^\x07]*\x07/g, "") // OSC sequences
    .replace(/\x1b[()][AB012]/g, "")    // charset designations
    .replace(/[\x00-\x08\x0b-\x0c\x0e-\x1f\x7f]/g, ""); // other control chars
}

// ── Server setup ──────────────────────────────────────────────────────────────

const server = new Server(
  { name: "yeonhoo-mcp", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  try {
    const result = await handleTool(name, args ?? {});
    return { content: [{ type: "text", text: String(result) }] };
  } catch (err) {
    return {
      content: [{ type: "text", text: `Error: ${err.message}` }],
      isError: true,
    };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
