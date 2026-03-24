import TaskCard from "./TaskCard";
import type { Priority, Status, Task } from "./types";

type Props = {
  col: { key: Status; label: string };
  tasks: Task[];
  isDropTarget: boolean;
  draggingTaskId: string | null;
  compactCards: boolean;
  showRelativeTimes: boolean;
  nowTs: number;
  onDragOver: () => void;
  onDragLeave: () => void;
  onDrop: (taskId: string) => void;
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

export default function KanbanColumn({
  col,
  tasks,
  isDropTarget,
  draggingTaskId,
  compactCards,
  showRelativeTimes,
  nowTs,
  onDragOver,
  onDragLeave,
  onDrop,
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
  return (
    <div
      className={`rounded-xl border p-4 transition ${
        isDropTarget ? "border-blue-500 bg-slate-900/90" : "border-slate-800 bg-slate-900"
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        onDragOver();
      }}
      onDragLeave={onDragLeave}
      onDrop={(e) => {
        e.preventDefault();
        const taskId = e.dataTransfer.getData("text/task-id");
        if (taskId) onDrop(taskId);
      }}
    >
      <h3 className="font-semibold mb-3">
        {col.label} ({tasks.length})
      </h3>
      <div className="space-y-3">
        {tasks.map((task, idx) => (
          <TaskCard
            key={task.id}
            task={task}
            colKey={col.key}
            isFirst={idx === 0}
            isLast={idx === tasks.length - 1}
            isDragging={draggingTaskId === task.id}
            compactCards={compactCards}
            showRelativeTimes={showRelativeTimes}
            nowTs={nowTs}
            onSetPriority={onSetPriority}
            onSetProjectDraft={onSetProjectDraft}
            onSetProject={onSetProject}
            onSetRisk={onSetRisk}
            onSetEta={onSetEta}
            onSetBlockedReason={onSetBlockedReason}
            onMove={onMove}
            onReorder={onReorder}
            onDuplicate={onDuplicate}
            onDelete={onDelete}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
          />
        ))}
        {tasks.length === 0 ? <p className="text-sm text-slate-500">No tasks</p> : null}
      </div>
    </div>
  );
}
