import { useEffect, useRef } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { WebglAddon } from "@xterm/addon-webgl";
import {
  terminalInput,
  resizePane,
  onTerminalOutput,
  onPaneExited,
  checkClaude,
  getClipboardFiles,
  getClipboardText,
} from "@/ipc/terminal";
import { useWorkspaceStore } from "@/stores/workspace";
import { useClaudeStore, analyzeOutput } from "@/stores/claude";
import { useAutocompleteStore } from "@/stores/autocomplete";
import { useHistoryStore } from "@/stores/history";
import { useConfigStore } from "@/stores/config";
import { notifyPermissionPrompt } from "@/lib/notifications";
import { formatPaths, convertPastedPaths } from "@/lib/smartPaste";
import { historyAdd } from "@/ipc/history";
import { getCurrentWebview } from "@tauri-apps/api/webview";
import type { PaneId } from "@/types/workspace";
import "@xterm/xterm/css/xterm.css";

// Theme is loaded from config store dynamically

interface TerminalPaneProps {
  paneId: PaneId;
  focused: boolean;
}

export default function TerminalPane({ paneId, focused }: TerminalPaneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const inputBufferRef = useRef("");  // Track current line input for / detection
  const setActivePane = useWorkspaceStore((s) => s.setActivePane);
  const setClaudeMode = useClaudeStore((s) => s.setClaudeMode);
  const updateMetrics = useClaudeStore((s) => s.updateMetrics);
  const setPermissionPending = useClaudeStore((s) => s.setPermissionPending);
  const isClaudeMode = useClaudeStore((s) => s.claudePanes.has(paneId));
  const currentTheme = useConfigStore((s) => s.theme);
  const config = useConfigStore((s) => s.config);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const appearance = config?.appearance;
    const term = new Terminal({
      fontFamily: appearance?.font_family
        ? `'${appearance.font_family}', 'Cascadia Code', 'Consolas', monospace`
        : "'JetBrains Mono', 'Cascadia Code', 'Consolas', monospace",
      fontSize: appearance?.font_size ?? 14,
      theme: currentTheme.terminal,
      cursorBlink: appearance?.cursor_blink ?? true,
      cursorStyle: (appearance?.cursor_style as "block" | "bar" | "underline") ?? "block",
      allowProposedApi: true,
      scrollback: config?.terminal?.scrollback ?? 10_000,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(el);

    try {
      term.loadAddon(new WebglAddon());
    } catch {
      // canvas fallback
    }

    termRef.current = term;
    fitAddonRef.current = fitAddon;

    // Defer fit + focus to next frame so browser computes layout first
    // (fixes first terminal having 0x0 dimensions when workspace transitions)
    const initFrame = requestAnimationFrame(() => {
      fitAddon.fit();
      term.focus();
      resizePane(paneId, term.cols, term.rows).catch(console.error);
    });

    // Intercept Ctrl+V and autocomplete navigation at DOM capture phase
    const handleKeyDown = (e: KeyboardEvent) => {
      const ac = useAutocompleteStore.getState();

      // Autocomplete navigation when visible
      if (ac.visible && ac.paneId === paneId) {
        if (e.key === "ArrowUp") {
          e.preventDefault();
          e.stopImmediatePropagation();
          ac.moveUp();
          return;
        }
        if (e.key === "ArrowDown") {
          e.preventDefault();
          e.stopImmediatePropagation();
          ac.moveDown();
          return;
        }
        if (e.key === "Enter" || e.key === "Tab") {
          e.preventDefault();
          e.stopImmediatePropagation();
          const selected = ac.getSelected();
          if (selected) {
            // Erase the typed "/" + query, then insert the full command
            const eraseLen = 1 + ac.query.length; // "/" + query chars
            const backspaces = "\x7f".repeat(eraseLen);
            terminalInput(paneId, backspaces + selected.name + " ").catch(console.error);
            ac.recordUsage(selected.name);
          }
          ac.close();
          return;
        }
        if (e.key === "Escape") {
          e.preventDefault();
          e.stopImmediatePropagation();
          ac.close();
          return;
        }
      }

      // Ctrl+R → history search
      if (e.key === "r" && e.ctrlKey && !e.shiftKey) {
        e.preventDefault();
        e.stopImmediatePropagation();
        const hs = useHistoryStore.getState();
        if (hs.visible) {
          hs.close();
        } else {
          hs.open(paneId);
        }
        return;
      }

      // History search navigation when visible
      const hs = useHistoryStore.getState();
      if (hs.visible && hs.paneId === paneId) {
        if (e.key === "ArrowUp") {
          e.preventDefault();
          e.stopImmediatePropagation();
          hs.moveUp();
          return;
        }
        if (e.key === "ArrowDown") {
          e.preventDefault();
          e.stopImmediatePropagation();
          hs.moveDown();
          return;
        }
        if (e.key === "Enter") {
          e.preventDefault();
          e.stopImmediatePropagation();
          const selected = hs.getSelected();
          if (selected) {
            terminalInput(paneId, selected.command).catch(console.error);
          }
          hs.close();
          return;
        }
        if (e.key === "Escape") {
          e.preventDefault();
          e.stopImmediatePropagation();
          hs.close();
          return;
        }
      }

      // Ctrl+Shift+C or Ctrl+C with selection → copy to clipboard
      if (e.key === "c" && e.ctrlKey) {
        const selection = term.getSelection();
        if (e.shiftKey || selection) {
          if (selection) {
            navigator.clipboard.writeText(selection).catch(console.error);
            term.clearSelection();
          }
          e.preventDefault();
          e.stopImmediatePropagation();
          return;
        }
      }

      // Ctrl+Insert → copy (Windows convention)
      if (e.key === "Insert" && e.ctrlKey) {
        const selection = term.getSelection();
        if (selection) {
          navigator.clipboard.writeText(selection).catch(console.error);
          term.clearSelection();
        }
        e.preventDefault();
        e.stopImmediatePropagation();
        return;
      }

      // Ctrl+V paste
      if (e.key === "v" && e.ctrlKey && !e.shiftKey) {
        e.preventDefault();
        e.stopImmediatePropagation();
        getClipboardFiles().then((files) => {
          if (files.length > 0) {
            const formatted = formatPaths(files);
            terminalInput(paneId, formatted).catch(console.error);
          } else {
            getClipboardText().then((text) => {
              if (text) {
                const converted = convertPastedPaths(text);
                terminalInput(paneId, converted).catch(console.error);
              }
            }).catch(console.error);
          }
        }).catch(console.error);
      }
    };
    el.addEventListener("keydown", handleKeyDown, true);

    // Also block paste event as safety net (e.g. right-click paste)
    const blockPaste = (e: Event) => {
      e.preventDefault();
      e.stopImmediatePropagation();
    };
    el.addEventListener("paste", blockPaste, true);

    // Keyboard → PTY + autocomplete input tracking
    const dataDisposable = term.onData((data) => {
      terminalInput(paneId, data).catch(console.error);

      const ac = useAutocompleteStore.getState();

      // Enter → record command in history, then reset buffer
      if (data === "\r") {
        const cmd = inputBufferRef.current.trim();
        if (cmd) {
          historyAdd(cmd, "", paneId).catch(console.error);
        }
        inputBufferRef.current = "";
        if (ac.visible) ac.close();
        return;
      }
      // Ctrl+C resets buffer
      if (data === "\x03") {
        inputBufferRef.current = "";
        if (ac.visible) ac.close();
        return;
      }

      // Backspace
      if (data === "\x7f") {
        inputBufferRef.current = inputBufferRef.current.slice(0, -1);
      } else if (data.length === 1 && data >= " ") {
        inputBufferRef.current += data;
      } else {
        // Non-printable (arrows, etc) — don't modify buffer
        return;
      }

      const buf = inputBufferRef.current;

      // Detect "/" at start of input
      if (buf === "/") {
        ac.open(paneId);
      } else if (buf.startsWith("/") && ac.visible) {
        ac.setQuery(buf.slice(1));
      } else if (!buf.startsWith("/") && ac.visible) {
        ac.close();
      }
    });

    // PTY → xterm + output analysis
    const unlisten1 = onTerminalOutput((e) => {
      if (e.pane_id !== paneId) return;
      term.write(e.data);

      // Analyze output for Claude patterns
      const analysis = analyzeOutput(e.data);
      if (analysis.isPermissionPrompt) {
        setPermissionPending(paneId);
        // Desktop notification if window not focused
        if (!document.hasFocus()) {
          notifyPermissionPrompt();
        }
      }
      if (analysis.tokensCost) {
        updateMetrics(paneId, analysis.tokensCost.tokens, analysis.tokensCost.cost);
      }
    });

    const unlisten2 = onPaneExited((e) => {
      if (e.pane_id === paneId) {
        term.write("\r\n\x1b[1;33m[Process exited]\x1b[0m\r\n");
      }
    });

    // Resize observer
    const ro = new ResizeObserver(() => {
      fitAddon.fit();
      resizePane(paneId, term.cols, term.rows).catch(console.error);
    });
    ro.observe(el);

    // Poll for Claude process detection (every 3s)
    const claudeInterval = setInterval(() => {
      checkClaude(paneId)
        .then((isClaude) => setClaudeMode(paneId, isClaude))
        .catch(() => {});
    }, 3000);

    // File drag & drop via Tauri native API (only insert to active/focused pane)
    const unlistenDrop = getCurrentWebview().onDragDropEvent((event) => {
      if (event.payload.type === "drop" && event.payload.paths.length > 0) {
        // Only handle if this pane is the active pane
        const store = useWorkspaceStore.getState();
        const activeTab = store.tabs.find((t) => t.id === store.activeTabId);
        if (activeTab?.activePaneId !== paneId) return;

        const formatted = formatPaths(event.payload.paths);
        terminalInput(paneId, formatted).catch(console.error);
      }
    });

    return () => {
      cancelAnimationFrame(initFrame);
      clearInterval(claudeInterval);
      ro.disconnect();
      dataDisposable.dispose();
      unlisten1.then((fn) => fn());
      unlisten2.then((fn) => fn());
      unlistenDrop.then((fn) => fn());
      el.removeEventListener("keydown", handleKeyDown, true);
      el.removeEventListener("paste", blockPaste, true);
      term.dispose();
    };
  }, [paneId, currentTheme.id]);

  // Focus management
  useEffect(() => {
    if (focused && termRef.current) {
      termRef.current.focus();
    }
  }, [focused]);

  return (
    <div
      ref={containerRef}
      className="terminal-pane"
      data-focused={focused}
      data-claude={isClaudeMode}
      onMouseDown={() => setActivePane(paneId)}
      style={{ width: "100%", height: "100%", overflow: "hidden" }}
    />
  );
}
