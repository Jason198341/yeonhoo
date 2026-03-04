import { create } from "zustand";
import type { PaneId } from "@/types/workspace";

interface ClaudeState {
  // Per-pane Claude mode
  claudePanes: Set<PaneId>;
  // Per-pane token/cost tracking (parsed from output)
  metrics: Record<PaneId, { tokens: number; cost: number }>;
  // Pending permission prompts
  permissionPending: PaneId | null;

  setClaudeMode: (paneId: PaneId, active: boolean) => void;
  updateMetrics: (paneId: PaneId, tokens: number, cost: number) => void;
  setPermissionPending: (paneId: PaneId | null) => void;
  isClaudePane: (paneId: PaneId) => boolean;
  getMetrics: (paneId: PaneId) => { tokens: number; cost: number } | undefined;
}

export const useClaudeStore = create<ClaudeState>((set, get) => ({
  claudePanes: new Set(),
  metrics: {},
  permissionPending: null,

  setClaudeMode: (paneId, active) =>
    set((s) => {
      const next = new Set(s.claudePanes);
      if (active) next.add(paneId);
      else next.delete(paneId);
      return { claudePanes: next };
    }),

  updateMetrics: (paneId, tokens, cost) =>
    set((s) => ({
      metrics: { ...s.metrics, [paneId]: { tokens, cost } },
    })),

  setPermissionPending: (paneId) => set({ permissionPending: paneId }),

  isClaudePane: (paneId) => get().claudePanes.has(paneId),

  getMetrics: (paneId) => get().metrics[paneId],
}));

// === Output pattern matchers ===

// Detect Claude Code permission prompt patterns
const PERMISSION_PATTERNS = [
  /Allow\s+(Read|Write|Edit|Bash|Execute)/i,
  /Do you want to proceed\?/i,
  /\[Y\/n\]/,
  /Allow once|Allow always|Deny/i,
];

// Detect token/cost output (from /cost command or status line)
const COST_PATTERN = /Tokens:\s*([\d,.]+[KMB]?)\s*.*?Cost:\s*\$([\d.]+)/i;
export function analyzeOutput(text: string): {
  isPermissionPrompt: boolean;
  tokensCost: { tokens: number; cost: number } | null;
} {
  const isPermissionPrompt = PERMISSION_PATTERNS.some((p) => p.test(text));

  let tokensCost: { tokens: number; cost: number } | null = null;
  const costMatch = text.match(COST_PATTERN);
  if (costMatch) {
    tokensCost = {
      tokens: parseTokenCount(costMatch[1]),
      cost: parseFloat(costMatch[2]),
    };
  }

  return { isPermissionPrompt, tokensCost };
}

function parseTokenCount(s: string): number {
  const clean = s.replace(/,/g, "");
  const num = parseFloat(clean);
  if (clean.endsWith("K")) return num * 1000;
  if (clean.endsWith("M")) return num * 1_000_000;
  if (clean.endsWith("B")) return num * 1_000_000_000;
  return num;
}
