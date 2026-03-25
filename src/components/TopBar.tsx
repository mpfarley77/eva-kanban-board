"use client";

type Props = {
  updatedAt: string;
  onRefresh: () => void;
  onExportJson: () => void;
  onExportCsv: () => void;
  onCopySummary: () => void;
  onToggleShortcuts: () => void;
  onToggleTips: () => void;
  onResetView: () => void;
  onClearCompleted: () => void;
  onLogout: () => void;
};

const btnClass =
  "min-h-9 rounded px-3 py-1.5 text-sm font-medium text-white transition hover:brightness-110";
const btnStyle = { background: "rgba(255,255,255,0.2)", borderRadius: "4px" };

export default function TopBar({
  updatedAt,
  onRefresh,
  onExportJson,
  onExportCsv,
  onCopySummary,
  onToggleShortcuts,
  onToggleTips,
  onResetView,
  onClearCompleted,
  onLogout,
}: Props) {
  return (
    <header
      className="fixed top-0 z-50 w-full flex items-center justify-between gap-4 px-5 py-3 backdrop-blur"
      style={{ background: "rgba(0,0,0,0.25)" }}
    >
      <div>
        <h1 className="text-[18px] font-bold leading-tight text-white" style={{ letterSpacing: "0.2px" }}>
          Patrick's Kanban Board
        </h1>
        <p className="text-xs text-white/60">Last sync: {updatedAt || "—"}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <button className={btnClass} style={btnStyle} onClick={onRefresh}>Refresh</button>
        <button className={btnClass} style={btnStyle} onClick={onExportJson}>Export JSON</button>
        <button className={btnClass} style={btnStyle} onClick={onExportCsv}>Export CSV</button>
        <button className={btnClass} style={btnStyle} onClick={onCopySummary}>Copy Summary</button>
        <button className={btnClass} style={btnStyle} onClick={onToggleShortcuts}>Shortcuts</button>
        <button className={btnClass} style={btnStyle} onClick={onToggleTips}>Tips</button>
        <button className={btnClass} style={btnStyle} onClick={onResetView}>Reset View</button>
        <button
          className={btnClass}
          style={{ background: "rgba(235,90,70,0.45)", borderRadius: "4px" }}
          onClick={onClearCompleted}
        >
          Clear Completed
        </button>
        <button className={btnClass} style={btnStyle} onClick={onLogout}>Logout</button>
      </div>
    </header>
  );
}
