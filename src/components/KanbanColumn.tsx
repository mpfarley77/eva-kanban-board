"use client";

import { useState } from "react";
import { type Status, type Priority, type Task } from "./types";
import TaskCard from "./TaskCard";

export const HEADER_COLORS: Record<Status, string> = {
  backlog:     "#0079BF",
  in_progress: "#D29034",
  review:      "#89609E",
  blocked:     "#C0392B",
  completed:   "#519839",
};

const DROP_PLACEHOLDER: React.CSSProperties = {
  border: "2px dashed #0079BF",
  background: "rgba(0, 121, 191, 0.1)",
  borderRadius: 8,
  minHeight: 44,
  flexShrink: 0,
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
  onReorderInColumn: (taskId: string, toIndex: number) => void;
  onDropAtIndex: (taskId: string, toIndex: number) => void;
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
  onReorderInColumn,
  onDropAtIndex,
  onDelete,
  noHeader,
  bodyMinHeight,
}: Props) {
  const headerColor = HEADER_COLORS[colKey];
  const [dropIndex, setDropIndex] = useState<number | null>(null);

  // True when the dragged card originates from this column.
  const isDraggingWithin =
    draggingTaskId !== null && tasks.some((t) => t.id === draggingTaskId);

  // Index of the card being dragged within the full task list (−1 if cross-column).
  const fromIdx = isDraggingWithin
    ? tasks.findIndex((t) => t.id === draggingTaskId)
    : -1;

  // For within-column drags, render the list WITHOUT the dragged card so that
  // dropIndex is a direct 1-to-1 splice index — no adjustment needed in the handler.
  // For cross-column drags the target column never contains the card, so no change.
  const renderTasks = (isDraggingWithin && draggingTaskId)
    ? tasks.filter((t) => t.id !== draggingTaskId)
    : tasks;

  // No-op: in "without-card" space, splicing back at fromIdx leaves the order
  // unchanged. Suppress the placeholder there so the user gets no false affordance.
  const isNoOpDrop = (idx: number) => isDraggingWithin && idx === fromIdx;

  return (
    <div
      className="kb-col"
      style={{
        borderRadius: noHeader ? "0 0 12px 12px" : 12,
        // Only tint the background for cross-column drops; intra-column uses the placeholder.
        background:
          isDropTarget && !isDraggingWithin
            ? "rgba(179, 212, 255, 0.55)"
            : "rgba(235, 236, 240, 0.95)",
        transition: "background 0.15s",
        minHeight: bodyMinHeight,
      }}
      onDragOver={(e) => {
        e.preventDefault();
        onDragOver();
        // Default drop position is after the last rendered card; overridden when
        // cursor enters a specific card's wrapper div below.
        if (dropIndex === null) setDropIndex(renderTasks.length);
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          onDragLeave();
          setDropIndex(null);
        }
      }}
      onDrop={(e) => {
        e.preventDefault();
        const taskId = e.dataTransfer.getData("text/task-id");
        if (!taskId) { setDropIndex(null); return; }
        // dropIndex IS the splice index — same value that positioned the placeholder.
        const idx = dropIndex ?? renderTasks.length;
        if (isDraggingWithin) {
          if (!isNoOpDrop(idx)) onReorderInColumn(taskId, idx);
        } else {
          onDropAtIndex(taskId, idx);
        }
        setDropIndex(null);
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
          <span style={{ fontSize: 14, fontWeight: 700, color: "#fff", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            {label}
          </span>
          <span style={{ width: 22, height: 22, borderRadius: "50%", background: "rgba(255,255,255,0.3)", color: "#fff", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            {tasks.length}
          </span>
        </div>
      )}

      {/* Column body */}
      <div style={{ padding: "10px 8px 12px", display: "flex", flexDirection: "column", gap: 8 }}>
        {renderTasks.flatMap((task, idx) => {
          const items: React.ReactNode[] = [];

          // Positional placeholder — hidden when the drop would be a no-op.
          if (dropIndex === idx && !isNoOpDrop(idx)) {
            items.push(
              <div key={`ph-${idx}`} style={DROP_PLACEHOLDER}
                onDragOver={(e) => e.preventDefault()} />
            );
          }

          items.push(
            <div
              key={task.id}
              onDragOver={(e) => {
                e.preventDefault();
                const rect = e.currentTarget.getBoundingClientRect();
                // idx here is already in "without-card" space (renderTasks excludes
                // the dragged card for within-column drags), so no adjustment needed.
                setDropIndex(e.clientY < rect.top + rect.height / 2 ? idx : idx + 1);
              }}
            >
              <TaskCard
                task={task}
                colKey={colKey}
                isFirst={idx === 0}
                isLast={idx === renderTasks.length - 1}
                compactCards={compactCards}
                isDragging={false}
                nowTs={nowTs}
                showRelativeTimes={showRelativeTimes}
                onDragStart={() => onDragStart(task.id)}
                onDragEnd={() => { setDropIndex(null); onDragEnd(); }}
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
            </div>
          );

          return items;
        })}

        {/* Placeholder after the last card */}
        {dropIndex === renderTasks.length && !isNoOpDrop(renderTasks.length) && (
          <div style={DROP_PLACEHOLDER} onDragOver={(e) => e.preventDefault()} />
        )}

        {/* "No tasks" — hidden while a drag is in progress over this column */}
        {renderTasks.length === 0 && dropIndex === null && (
          <p style={{ fontSize: 13, color: "#5E6C84", padding: "4px 4px" }}>No tasks</p>
        )}
      </div>
    </div>
  );
}
