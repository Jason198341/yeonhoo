export interface ClaudeCommand {
  name: string;
  description: string;
  syntax: string;
  category: "workflow" | "context" | "config" | "info" | "mcp";
}

export const CLAUDE_COMMANDS: ClaudeCommand[] = [
  // Workflow
  { name: "/compact", description: "Compact conversation to save context", syntax: "/compact [instructions]", category: "workflow" },
  { name: "/clear", description: "Clear conversation history", syntax: "/clear", category: "workflow" },
  { name: "/reset", description: "Reset the entire session", syntax: "/reset", category: "workflow" },
  { name: "/undo", description: "Undo the last file change", syntax: "/undo", category: "workflow" },
  { name: "/resume", description: "Resume previous conversation", syntax: "/resume", category: "workflow" },
  { name: "/review", description: "Review a pull request", syntax: "/review [pr-url]", category: "workflow" },
  { name: "/pr-comments", description: "View PR comments", syntax: "/pr-comments", category: "workflow" },

  // Context
  { name: "/add-dir", description: "Add a directory to context", syntax: "/add-dir <path>", category: "context" },
  { name: "/init", description: "Initialize CLAUDE.md for project", syntax: "/init", category: "context" },
  { name: "/memory", description: "Edit CLAUDE.md memory file", syntax: "/memory", category: "context" },

  // Config
  { name: "/config", description: "Open configuration", syntax: "/config", category: "config" },
  { name: "/model", description: "Switch AI model", syntax: "/model <model-name>", category: "config" },
  { name: "/permissions", description: "View/modify permissions", syntax: "/permissions", category: "config" },
  { name: "/allowed-tools", description: "Show allowed tools", syntax: "/allowed-tools", category: "config" },

  // Info
  { name: "/cost", description: "Show token usage and cost", syntax: "/cost", category: "info" },
  { name: "/help", description: "Show help information", syntax: "/help [topic]", category: "info" },
  { name: "/status", description: "Show current session status", syntax: "/status", category: "info" },
  { name: "/version", description: "Show Claude Code version", syntax: "/version", category: "info" },
  { name: "/doctor", description: "Check system health", syntax: "/doctor", category: "info" },
  { name: "/bugs", description: "Report a bug", syntax: "/bugs", category: "info" },

  // MCP
  { name: "/mcp", description: "Manage MCP servers", syntax: "/mcp", category: "mcp" },
  { name: "/install-github-mcp", description: "Install GitHub MCP server", syntax: "/install-github-mcp", category: "mcp" },
];
