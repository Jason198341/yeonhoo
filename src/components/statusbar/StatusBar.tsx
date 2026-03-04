import { useEffect, useState } from "react";
import { useWorkspaceStore } from "@/stores/workspace";
import { useClaudeStore } from "@/stores/claude";
import { useConfigStore } from "@/stores/config";
import { getThemeList } from "@/lib/themes";

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return `${n}`;
}

function formatMB(bytes: number): string {
  return `${(bytes / 1024 / 1024).toFixed(0)}MB`;
}

function useMemoryUsage() {
  const [mem, setMem] = useState("");
  useEffect(() => {
    const update = () => {
      if ("memory" in performance) {
        const m = (performance as unknown as { memory: { usedJSHeapSize: number } }).memory;
        setMem(formatMB(m.usedJSHeapSize));
      }
    };
    update();
    const id = setInterval(update, 5000);
    return () => clearInterval(id);
  }, []);
  return mem;
}

export default function StatusBar() {
  const tabs = useWorkspaceStore((s) => s.tabs);
  const paneCount = useWorkspaceStore((s) => s.getPaneIds)().length;
  const activeTab = useWorkspaceStore((s) => s.activeTab)();
  const activePaneId = activeTab?.activePaneId;
  const isClaudeMode = useClaudeStore((s) =>
    activePaneId ? s.claudePanes.has(activePaneId) : false,
  );
  const metrics = useClaudeStore((s) =>
    activePaneId ? s.metrics[activePaneId] : undefined,
  );
  const permissionPending = useClaudeStore((s) => s.permissionPending);
  const currentTheme = useConfigStore((s) => s.theme);
  const setTheme = useConfigStore((s) => s.setTheme);
  const themes = getThemeList();
  const mem = useMemoryUsage();

  const cycleTheme = () => {
    const idx = themes.findIndex((t) => t.id === currentTheme.id);
    const next = themes[(idx + 1) % themes.length];
    setTheme(next.id);
  };

  return (
    <div className="status-bar">
      <span className="status-left">
        {isClaudeMode ? (
          <span className="claude-badge">Claude</span>
        ) : (
          <span>Terminal</span>
        )}
        {permissionPending && permissionPending === activePaneId && (
          <span className="permission-alert"> ⏳ Permission</span>
        )}
      </span>
      <span className="status-center" />
      <span className="status-right">
        {isClaudeMode && metrics && (
          <span className="claude-metrics">
            {formatTokens(metrics.tokens)} tokens · ${metrics.cost.toFixed(2)}
            {" · "}
          </span>
        )}
        <span
          className="theme-switcher"
          onClick={cycleTheme}
          title={`Theme: ${currentTheme.name} (click to cycle)`}
        >
          {currentTheme.name}
        </span>
        {" · "}
        {tabs.length} tab{tabs.length !== 1 ? "s" : ""} · {paneCount} pane{paneCount !== 1 ? "s" : ""}
        {mem && ` · ${mem}`}
        {" · v0.1.0"}
      </span>
    </div>
  );
}
