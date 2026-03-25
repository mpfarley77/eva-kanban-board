"use client";

import { type Status, type Priority, type Task } from "./types";
import TaskCard from "./TaskCard";

export const HEADER_COLORS: Record<Status, string> = {
  backlog:     "#0079BF",
  in_progress: "#D29034",
  review:      "#89609E",
  blocked:     "#C0392B",
  completed:   "#519839",
};

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
  projectOptions: string[];
  onNewProject: (name: string) => void;
  onSetPriority: (taskId: string, priority: Priority) => void;
  onSetProjectDraft: (taskId: string, value: string) => void;
  onSetProject: (taskId: string, value: string) => void;
  onSetRisk: (taskId: string, risk: NonNullable<Task["risk_state"]>) => void;
  onSetEta: (taskId: string, eta: string) => void;
  onSetBlockedReason: (taskId: string, reason: string) => void;
  onReorderUp: (taskId: string) => void;
  onReorderDown: (taskId: string) => void;
  onDelete: (taskId: string) => void;
  noHeader?: boolean;
  bodyMinHeight?: string;
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
  projectOptions,
  onNewProject,
  onSetPriority,
  onSetProjectDraft,
  onSetProject,
  onSetRisk,
  onSetEta,
  onSetBlockedReason,
  onReorderUp,
  onReorderDown,
  onDelete,
  noHeader,
  bodyMinHeight,
}: Props) {
  const headerColor = HEADER_COLORS[colKey];

  return (
    <div
      style={{
        width: 280,
        flexShrink: 0,
        borderRadius: noHeader ? "0 0 12px 12px" : 12,
        background: isDropTarget
          ? "rgba(179, 212, 255, 0.55)"
          : "rgba(235, 236, 240, 0.95)",
        transition: "background 0.15s",
        minHeight: bodyMinHeight,
      }}
      onDragOver={(e) => { e.preventDefault(); onDragOver(); }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          onDragLeave();
        }
      }}
      onDrop={(e) => {
        e.preventDefault();
        const taskId = e.dataTransfer.getData("text/task-id");
        if (taskId) onDrop(taskId);
      }}
    >
      {/* Column header */}
      {!noHeader && (
        <div
          style={{
            background: headerColor,
            borderRadius: "12px 12px 0 0",
            padding: "10px 12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
          }}
        >
          <span
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: "#fff",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            {label}
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span
              style={{
                width: 22,
                height: 22,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.3)",
                color: "#fff",
                fontSize: 11,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {tasks.length}
            </span>
          </div>
        </div>
      )}

      {/* Column body */}
      <div style={{ padding: "10px 8px 12px", display: "flex", flexDirection: "column", gap: 8 }}>
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
            projectOptions={projectOptions}
            onNewProject={onNewProject}
            onSetPriority={(p) => onSetPriority(task.id, p)}
            onSetProjectDraft={(v) => onSetProjectDraft(task.id, v)}
            onSetProject={(v) => onSetProject(task.id, v)}
            onSetRisk={(r) => onSetRisk(task.id, r)}
            onSetEta={(eta) => onSetEta(task.id, eta)}
            onSetBlockedReason={(reason) => onSetBlockedReason(task.id, reason)}
            onReorderUp={() => onReorderUp(task.id)}
            onReorderDown={() => onReorderDown(task.id)}
            onDelete={() => onDelete(task.id)}
          />
        ))}
        {tasks.length === 0 && !isDropTarget && (
          <p style={{ fontSize: 13, color: "#5E6C84", padding: "4px 4px" }}>No tasks</p>
        )}
        {isDropTarget && (
          <div
            style={{
              border: "2px dashed #0079BF",
              background: "rgba(0, 121, 191, 0.08)",
              borderRadius: 8,
              height: 72,
              flexShrink: 0,
            }}
          />
        )}
      </div>
    </div>
  );
}
