import { useCallback, useRef } from "react";
import type { PaneTree, PaneId } from "@/types/workspace";
import { useWorkspaceStore } from "@/stores/workspace";
import TerminalPane from "@/components/terminal/TerminalPane";

interface PaneContainerProps {
  tree: PaneTree;
  activePaneId: PaneId;
}

export default function PaneContainer({ tree, activePaneId }: PaneContainerProps) {
  if (tree.type === "leaf") {
    return (
      <TerminalPane
        paneId={tree.paneId}
        focused={tree.paneId === activePaneId}
      />
    );
  }

  const isHorizontal = tree.direction === "horizontal";

  return (
    <div
      className="split-container"
      style={{
        display: "flex",
        flexDirection: isHorizontal ? "row" : "column",
        width: "100%",
        height: "100%",
      }}
    >
      <div style={{ flex: `0 0 ${tree.ratio * 100}%`, overflow: "hidden" }}>
        <PaneContainer tree={tree.first} activePaneId={activePaneId} />
      </div>
      <SplitHandle direction={tree.direction} tree={tree} />
      <div style={{ flex: 1, overflow: "hidden" }}>
        <PaneContainer tree={tree.second} activePaneId={activePaneId} />
      </div>
    </div>
  );
}

function SplitHandle({
  direction,
  tree,
}: {
  direction: "horizontal" | "vertical";
  tree: PaneTree & { type: "split" };
}) {
  const handleRef = useRef<HTMLDivElement>(null);
  const resizeSplit = useWorkspaceStore((s) => s.resizeSplit);

  const isHorizontal = direction === "horizontal";

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const parent = handleRef.current?.parentElement;
      if (!parent) return;

      const rect = parent.getBoundingClientRect();
      const startPos = isHorizontal ? e.clientX : e.clientY;
      const totalSize = isHorizontal ? rect.width : rect.height;
      const startRatio = tree.ratio;

      // Get the first pane ID to use as resize target
      const firstPaneId = getFirstPaneId(tree.first);

      const onMove = (ev: MouseEvent) => {
        const currentPos = isHorizontal ? ev.clientX : ev.clientY;
        const delta = (currentPos - startPos) / totalSize;
        resizeSplit(firstPaneId, startRatio + delta);
      };

      const onUp = () => {
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      };

      document.body.style.cursor = isHorizontal ? "col-resize" : "row-resize";
      document.body.style.userSelect = "none";
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    },
    [isHorizontal, tree, resizeSplit],
  );

  return (
    <div
      ref={handleRef}
      className="split-handle"
      onMouseDown={onMouseDown}
      style={{
        flexShrink: 0,
        background: "#1e293b",
        cursor: isHorizontal ? "col-resize" : "row-resize",
        ...(isHorizontal
          ? { width: 4, height: "100%" }
          : { height: 4, width: "100%" }),
      }}
      onMouseEnter={(e) => {
        (e.target as HTMLDivElement).style.background = "#8b5cf6";
      }}
      onMouseLeave={(e) => {
        (e.target as HTMLDivElement).style.background = "#1e293b";
      }}
    />
  );
}

function getFirstPaneId(tree: PaneTree): PaneId {
  if (tree.type === "leaf") return tree.paneId;
  return getFirstPaneId(tree.first);
}
