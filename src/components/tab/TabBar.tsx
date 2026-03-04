import { useWorkspaceStore } from "@/stores/workspace";
import type { TabId } from "@/types/workspace";
import { createPane, closePane as ipcClosePane } from "@/ipc/terminal";

export default function TabBar() {
  const tabs = useWorkspaceStore((s) => s.tabs);
  const activeTabId = useWorkspaceStore((s) => s.activeTabId);
  const setActiveTab = useWorkspaceStore((s) => s.setActiveTab);
  const addTab = useWorkspaceStore((s) => s.addTab);
  const removeTab = useWorkspaceStore((s) => s.removeTab);

  const handleNewTab = async () => {
    try {
      const paneId = await createPane();
      addTab(paneId);
    } catch (err) {
      console.error("Failed to create tab:", err);
    }
  };

  const handleCloseTab = async (tabId: TabId, e: React.MouseEvent) => {
    e.stopPropagation();
    const removedPanes = removeTab(tabId);
    for (const id of removedPanes) {
      ipcClosePane(id).catch(console.error);
    }
  };

  return (
    <div className="tab-bar">
      <div className="tab-list">
        {tabs.map((tab, i) => (
          <button
            key={tab.id}
            className={`tab-item ${tab.id === activeTabId ? "active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
            title={tab.title}
          >
            <span className="tab-index">{i + 1}</span>
            <span className="tab-title">{tab.title}</span>
            <span
              className="tab-close"
              onClick={(e) => handleCloseTab(tab.id, e)}
              title="Close tab"
            >
              ×
            </span>
          </button>
        ))}
      </div>
      <button className="tab-new" onClick={handleNewTab} title="New tab (Ctrl+Shift+T)">
        +
      </button>
    </div>
  );
}
