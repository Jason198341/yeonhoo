# Yeonhoo Terminal

Claude Code optimized next-generation terminal emulator.

Built with **Tauri 2 + Rust + React + xterm.js**.

## Features

- **Smart Paste** — Clipboard integration via Win32 API (CF_HDROP file paths, CF_UNICODETEXT). Auto-converts Windows paths to Unix for MSYS2/WSL.
- **Split Panes** — Horizontal/vertical splits with drag-to-resize. Recursive tree-based layout.
- **Tab Management** — Multiple tabs with keyboard shortcuts (Ctrl+Shift+T/W, Ctrl+Tab).
- **Claude Code Detection** — Auto-detects Claude Code processes, shows mode badge, tracks token/cost metrics.
- **Session Restore** — Saves tab/pane layout on change, restores on restart.
- **Command History** — SQLite + FTS5 full-text search. Ctrl+R to search.
- **Command Palette** — Ctrl+Shift+P for quick actions.
- **Slash Autocomplete** — Type `/` to autocomplete Claude Code commands.
- **Theme System** — 5 built-in themes + plugin-extensible.
- **Plugin System** — Drop JSON manifests in `~/.yeonhoo/plugins/` to add themes, commands, and keybindings.
- **Config Hot-Reload** — TOML config at `~/.yeonhoo/config.toml`, auto-reloads on save.

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl+Shift+T` | New Tab |
| `Ctrl+Shift+W` | Close Tab |
| `Ctrl+Tab` | Next Tab |
| `Ctrl+Shift+Tab` | Previous Tab |
| `Ctrl+Shift+\` | Split Horizontal |
| `Ctrl+Shift+-` | Split Vertical |
| `Ctrl+Shift+X` | Close Pane |
| `Ctrl+Shift+P` | Command Palette |
| `Ctrl+R` | Search History |
| `Ctrl+V` | Smart Paste |
| `Ctrl+C` (with selection) | Copy |
| `Ctrl+Shift+C` | Copy |

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Tauri 2.10 |
| Backend | Rust (portable-pty, rusqlite, notify, sysinfo) |
| Frontend | React 19, TypeScript, Zustand 5 |
| Terminal | xterm.js 6 + WebGL addon |
| Build | Vite 7, Bun |

## Development

```bash
# Install dependencies
bun install

# Run in development mode
bun run tauri dev

# Build installers (MSI + NSIS)
bun run tauri build
```

## Plugin System

Create a directory under `~/.yeonhoo/plugins/<plugin-name>/` with a `plugin.json`:

```json
{
  "id": "my-theme",
  "name": "My Custom Theme",
  "version": "1.0.0",
  "themes": [
    {
      "id": "custom-dark",
      "name": "Custom Dark",
      "terminal": {
        "background": "#1a1a2e",
        "foreground": "#eaeaea",
        "cursor": "#e94560"
      },
      "ui": {
        "bg": "#1a1a2e",
        "bgSecondary": "#16213e",
        "border": "#0f3460",
        "text": "#eaeaea",
        "textMuted": "#7f8c8d",
        "accent": "#e94560",
        "accentDim": "#e9456044"
      }
    }
  ],
  "commands": [],
  "keybindings": []
}
```

## Configuration

Edit `~/.yeonhoo/config.toml`:

```toml
[appearance]
theme = "yeonhoo-dark"
font_family = "JetBrains Mono"
font_size = 14

[terminal]
scrollback = 10000
cursor_style = "block"
cursor_blink = true

[claude]
auto_detect = true
show_metrics = true
```

## License

MIT
