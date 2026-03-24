import { OBJECTIVES, PRIORITIES, RISK_STATES } from "./types";
import type { Priority, Status, Task } from "./types";

type Props = {
  task: Task;
  colKey: Status;
  isFirst: boolean;
  isLast: boolean;
  isDragging: boolean;
  compactCards: boolean;
  showRelativeTimes: boolean;
  nowTs: number;
  onSetPriority: (taskId: string, priority: Priority) => void;
  onSetProjectDraft: (taskId: string, project: string) => void;
  onSetProject: (taskId: string, project: string) => void;
  onSetRisk: (taskId: string, risk: NonNullable<Task["risk_state"]>) => void;
  onSetEta: (taskId: string, eta: string) => void;
  onSetBlockedReason: (taskId: string, reason: string) => void;
  onMove: (taskId: string, status: Status) => void;
  onReorder: (taskId: string, direction: "up" | "down") => void;
  onDuplicate: (taskId: string) => void;
  onDelete: (taskId: string) => void;
  onDragStart: (taskId: string) => void;
  onDragEnd: () => void;
};

function formatRelative(iso: string | null | undefined, nowTs: number): string {
  if (!iso) return "-";
  const ts = Date.parse(iso);
  if (Number.isNaN(ts) || !nowTs) return "-";
  const diffMs = nowTs - ts;
  const absMin = Math.floor(Math.abs(diffMs) / 60000);
  if (absMin < 1) return "just now";
  if (absMin < 60) return `${absMin}m ago`;
  const hrs = Math.floor(absMin / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function TaskCard({
  task,
  colKey,
  isFirst,
  isLast,
  isDragging,
  compactCards,
  showRelativeTimes,
  nowTs,
  onSetPriority,
  onSetProjectDraft,
  onSetProject,
  onSetRisk,
  onSetEta,
  onSetBlockedReason,
  onMove,
  onReorder,
  onDuplicate,
  onDelete,
  onDragStart,
  onDragEnd,
}: Props) {
  const meta = OBJECTIVES.find((o) => o.key === task.objective)!;
  const isStale =
    task.status === "in_progress" &&
    !!task.started_at &&
    nowTs - Date.parse(task.started_at) > 48 * 60 * 60 * 1000;

  const prevStatus: Status =
    colKey === "in_progress" ? "backlog" : colKey === "review" ? "in_progress" : "review";
  const nextStatus: Status =
    colKey === "backlog" ? "in_progress" : colKey === "in_progress" ? "review" : "completed";

  return (
    <article
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/task-id", task.id);
        onDragStart(task.id);
      }}
      onDragEnd={onDragEnd}
      className={`rounded-lg border bg-slate-950 ${compactCards ? "p-2 space-y-2" : "p-3 space-y-3"} ${
        isDragging ? "border-blue-500 opacity-70" : "border-slate-700"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1">
          <p className="font-medium">{task.title}</p>
          <div className="flex flex-wrap gap-1">
            <span className={`text-[10px] px-2 py-0.5 rounded-full ${meta.color}`}>{meta.label}</span>
            {task.risk_state === "at_risk" ? (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-700 text-white">AT RISK</span>
            ) : task.risk_state === "watch" ? (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-700 text-white">WATCH</span>
            ) : (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-700 text-slate-100">NORMAL</span>
            )}
            {(task.blocked_reason ?? "").trim() ? (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-700 text-white">BLOCKED</span>
            ) : null}
            {task.eta ? (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-700 text-white">
                ETA {new Date(task.eta).toLocaleDateString()}
              </span>
            ) : null}
            {isStale ? (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-700 text-white">STALE &gt;48H</span>
            ) : null}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs">
        <label className="text-slate-400">Priority</label>
        <select
          value={task.priority}
          onChange={(e) => onSetPriority(task.id, e.target.value as Priority)}
          className="rounded border border-slate-700 bg-slate-900 px-2 py-1"
        >
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2 text-xs">
        <label className="text-slate-400">Project</label>
        <input
          value={task.project ?? ""}
          onChange={(e) => onSetProjectDraft(task.id, e.target.value)}
          onBlur={(e) => onSetProject(task.id, e.currentTarget.value)}
          placeholder="Unassigned"
          className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
        <div className="flex items-center gap-2">
          <label className="text-slate-400">Risk</label>
          <select
            value={task.risk_state ?? "normal"}
            onChange={(e) => onSetRisk(task.id, e.target.value as NonNullable<Task["risk_state"]>)}
            className="rounded border border-slate-700 bg-slate-900 px-2 py-1"
          >
            {RISK_STATES.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-slate-400">ETA</label>
          <input
            type="datetime-local"
            defaultValue={task.eta ? task.eta.slice(0, 16) : ""}
            onBlur={(e) => {
              const v = e.currentTarget.value;
              onSetEta(task.id, v ? new Date(v).toISOString() : "");
            }}
            className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1"
          />
        </div>
      </div>

      <div className="flex items-start gap-2 text-xs">
        <label className="text-slate-400 mt-1">Blocker</label>
        <input
          defaultValue={task.blocked_reason ?? ""}
          onBlur={(e) => onSetBlockedReason(task.id, e.currentTarget.value.trim())}
          placeholder="Optional blocked reason"
          className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1"
        />
      </div>

      {showRelativeTimes ? (
        <p className="text-[11px] text-slate-500">
          Updated {formatRelative(task.updated_at, nowTs)} · Created {formatRelative(task.created_at, nowTs)}
        </p>
      ) : null}

      <div className="flex gap-2 flex-wrap">
        {colKey === "backlog" ? (
          <>
            <button
              className="min-h-9 text-xs rounded border border-slate-600 px-3 py-1.5"
              onClick={() => onReorder(task.id, "up")}
              disabled={isFirst}
            >
              ↑
            </button>
            <button
              className="min-h-9 text-xs rounded border border-slate-600 px-3 py-1.5"
              onClick={() => onReorder(task.id, "down")}
              disabled={isLast}
            >
              ↓
            </button>
          </>
        ) : null}
        {colKey !== "backlog" && (
          <button
            className="min-h-9 text-xs rounded border border-slate-600 px-3 py-1.5"
            onClick={() => onMove(task.id, prevStatus)}
          >
            ← Back
          </button>
        )}
        {colKey !== "completed" && (
          <button
            className="min-h-9 text-xs rounded border border-slate-600 px-3 py-1.5"
            onClick={() => onMove(task.id, nextStatus)}
          >
            Next →
          </button>
        )}
        <button
          className="min-h-9 text-xs rounded border border-cyan-700 text-cyan-300 px-3 py-1.5"
          onClick={() => onDuplicate(task.id)}
        >
          Duplicate
        </button>
        <button
          className="min-h-9 text-xs rounded border border-red-700 text-red-300 px-3 py-1.5"
          onClick={() => onDelete(task.id)}
        >
          Delete
        </button>
      </div>
    </article>
  );
}
