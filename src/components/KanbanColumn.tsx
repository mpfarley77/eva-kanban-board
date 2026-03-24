"use client";

import { type Status, type Priority, type Task } from "./types";
import TaskCard from "./TaskCard";

type Props = {
  label: string;
  colKey: Status;
  tasks: Task[];
  backlogLength: number;
  isDropTarget: boolean;
  draggingTaskId: string | null;
  compactCards: boolean;
  nowTs: number;
  showRelativeTimes: boolean;
  onDragOver: () => void;
  onDragLeave: () => void;
  onDrop: (taskId: string) => void;
  onDragStart: (taskId: string) => void;
  onDragEnd: () => void;
  onSetPriority: (taskId: string, priority: Priority) => void;
  onSetProjectDraft: (taskId: string, value: string) => void;
  onSetProject: (taskId: string, value: string) => void;
  onSetRisk: (taskId: string, risk: NonNullable<Task["risk_state"]>) => void;
  onSetEta: (taskId: string, eta: string) => void;
  onSetBlockedReason: (taskId: string, reason: string) => void;
  onReorderUp: (taskId: string) => void;
  onReorderDown: (taskId: string) => void;
  onMoveBack: (taskId: string) => void;
  onMoveNext: (taskId: string) => void;
  onDuplicate: (taskId: string) => void;
  onDelete: (taskId: string) => void;
};

export default function KanbanColumn({
  label,
  colKey,
  tasks,
  backlogLength,
  isDropTarget,
  draggingTaskId,
  compactCards,
  nowTs,
  showRelativeTimes,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragStart,
  onDragEnd,
  onSetPriority,
  onSetProjectDraft,
  onSetProject,
  onSetRisk,
  onSetEta,
  onSetBlockedReason,
  onReorderUp,
  onReorderDown,
  onMoveBack,
  onMoveNext,
  onDuplicate,
  onDelete,
}: Props) {
  return (
    <div
      className={`rounded-xl border p-4 transition ${isDropTarget ? "border-blue-500 bg-slate-900/90" : "border-slate-800 bg-slate-900"}`}
      onDragOver={(e) => { e.preventDefault(); onDragOver(); }}
      onDragLeave={onDragLeave}
      onDrop={(e) => {
        e.preventDefault();
        const taskId = e.dataTransfer.getData("text/task-id");
        if (taskId) onDrop(taskId);
      }}
    >
      <h3 className="font-semibold mb-3">{label} ({tasks.length})</h3>
      <div className="space-y-3">
        {tasks.map((task, idx) => (
          <TaskCard
            key={task.id}
            task={task}
            colKey={colKey}
            isFirst={idx === 0}
            isLast={idx === backlogLength - 1}
            compactCards={compactCards}
            isDragging={draggingTaskId === task.id}
            nowTs={nowTs}
            showRelativeTimes={showRelativeTimes}
            onDragStart={() => onDragStart(task.id)}
            onDragEnd={onDragEnd}
            onSetPriority={(p) => onSetPriority(task.id, p)}
            onSetProjectDraft={(v) => onSetProjectDraft(task.id, v)}
            onSetProject={(v) => onSetProject(task.id, v)}
            onSetRisk={(r) => onSetRisk(task.id, r)}
            onSetEta={(eta) => onSetEta(task.id, eta)}
            onSetBlockedReason={(reason) => onSetBlockedReason(task.id, reason)}
            onReorderUp={() => onReorderUp(task.id)}
            onReorderDown={() => onReorderDown(task.id)}
            onMoveBack={() => onMoveBack(task.id)}
            onMoveNext={() => onMoveNext(task.id)}
            onDuplicate={() => onDuplicate(task.id)}
            onDelete={() => onDelete(task.id)}
          />
        ))}
        {tasks.length === 0 ? <p className="text-sm text-slate-500">No tasks</p> : null}
      </div>
    </div>
  );
}
