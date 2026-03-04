import { useEffect, useRef } from "react";
import { useHistoryStore } from "@/stores/history";

export default function HistorySearch() {
  const { visible, query, results, selectedIndex } = useHistoryStore();
  const setQuery = useHistoryStore((s) => s.setQuery);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (visible && inputRef.current) {
      inputRef.current.focus();
    }
  }, [visible]);

  useEffect(() => {
    if (!listRef.current) return;
    const item = listRef.current.children[selectedIndex] as HTMLElement | undefined;
    item?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  if (!visible) return null;

  return (
    <div className="history-search">
      <div className="history-header">
        <span className="history-icon">&#x1F50D;</span>
        <input
          ref={inputRef}
          className="history-input"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search command history..."
          spellCheck={false}
        />
        <span className="history-hint">
          {results.length} result{results.length !== 1 ? "s" : ""}
        </span>
      </div>
      <div className="history-list" ref={listRef}>
        {results.length === 0 ? (
          <div className="history-empty">No commands found</div>
        ) : (
          results.map((entry, i) => (
            <div
              key={entry.id}
              className={`history-item ${i === selectedIndex ? "selected" : ""}`}
            >
              <span className="history-command">{entry.command}</span>
              <span className="history-meta">{entry.timestamp}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
