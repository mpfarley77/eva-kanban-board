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
        // Default drop position is after the last card; overridden when cursor
        // enters a specific card's wrapper div below.
        if (dropIndex === null) setDropIndex(tasks.length);
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
        const idx = dropIndex ?? tasks.length;
        if (isDraggingWithin) {
          onReorderInColumn(taskId, idx);
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
        {tasks.flatMap((task, idx) => {
          const items: React.ReactNode[] = [];

          // Positional placeholder — same style for both intra and cross-column drags.
          if (dropIndex === idx) {
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
                setDropIndex(e.clientY < rect.top + rect.height / 2 ? idx : idx + 1);
              }}
            >
              <TaskCard
                task={task}
                colKey={colKey}
                isFirst={idx === 0}
                isLast={idx === backlogLength - 1}
                compactCards={compactCards}
                isDragging={draggingTaskId === task.id}
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
        {dropIndex === tasks.length && (
          <div style={DROP_PLACEHOLDER} onDragOver={(e) => e.preventDefault()} />
        )}

        {/* "No tasks" — hidden while a drag is in progress over this column */}
        {tasks.length === 0 && dropIndex === null && (
          <p style={{ fontSize: 13, color: "#5E6C84", padding: "4px 4px" }}>No tasks</p>
        )}
      </div>
    </div>
  );
}
