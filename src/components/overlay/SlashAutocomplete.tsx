import { useEffect, useRef } from "react";
import { useAutocompleteStore } from "@/stores/autocomplete";

const CATEGORY_COLORS: Record<string, string> = {
  workflow: "#8b5cf6",
  context: "#06b6d4",
  config: "#eab308",
  info: "#22c55e",
  mcp: "#f97316",
};

export default function SlashAutocomplete() {
  const { visible, filtered, selectedIndex, query } = useAutocompleteStore();
  const listRef = useRef<HTMLDivElement>(null);

  // Scroll selected item into view
  useEffect(() => {
    if (!listRef.current) return;
    const item = listRef.current.children[selectedIndex] as HTMLElement | undefined;
    item?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  if (!visible || filtered.length === 0) return null;

  return (
    <div className="slash-autocomplete">
      <div className="slash-header">
        <span className="slash-prompt">/{query}</span>
        <span className="slash-hint">↑↓ navigate · Enter select · Esc close</span>
      </div>
      <div className="slash-list" ref={listRef}>
        {filtered.map((cmd, i) => (
          <div
            key={cmd.name}
            className={`slash-item ${i === selectedIndex ? "selected" : ""}`}
          >
            <div className="slash-item-left">
              <span className="slash-name">{cmd.name}</span>
              <span
                className="slash-category"
                style={{ color: CATEGORY_COLORS[cmd.category] }}
              >
                {cmd.category}
              </span>
            </div>
            <span className="slash-desc">{cmd.description}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
