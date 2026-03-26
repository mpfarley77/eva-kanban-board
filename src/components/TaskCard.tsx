"use client";

import { useState } from "react";
import {
  type Objective,
  type Status,
  type Priority,
  type Task,
  PRIORITIES,
  RISK_STATES,
} from "./types";

// ─── Visual lookup tables ────────────────────────────────────────────────────

const PRIORITY_COLORS: Record<Priority, string> = {
  P0: "#EB5A46",
  P1: "#CF9F02",
  P2: "#61BD4F",
  P3: "#C377E0",
};

const OBJECTIVE_STYLES: Record<
  Objective,
  { stripColor: string; tagBg: string; tagText: string; label: string }
> = {
  skyworks:     { stripColor: "#0079BF", tagBg: "#E4F0F6", tagText: "#0079BF", label: "Skyworks" },
  personal:     { stripColor: "#519839", tagBg: "#EEF6EC", tagText: "#519839", label: "Personal" },
  side_hustles: { stripColor: "#D29034", tagBg: "#FCF1E2", tagText: "#B8860B", label: "Side Hustles" },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatRelative = (iso: string | null | undefined, nowTs: number) => {
  if (!iso) return "-";
  const ts = Date.parse(iso);
  if (Number.isNaN(ts) || !nowTs) return "-";
  const absMin = Math.floor(Math.abs(nowTs - ts) / 60000);
  if (absMin < 1) return "just now";
  if (absMin < 60) return `${absMin}m ago`;
  const hrs = Math.floor(absMin / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

// ─── Shared style tokens ──────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: "100%",
  border: "1px solid #DFE1E6",
  borderRadius: 4,
  background: "#F4F5F7",
  color: "#172B4D",
  fontSize: 12,
  padding: "3px 7px",
};

const labelStyle: React.CSSProperties = {
  fontSize: 11,
  color: "#5E6C84",
  whiteSpace: "nowrap",
};

const actionBtnStyle: React.CSSProperties = {
  border: "1px solid #DFE1E6",
  borderRadius: 4,
  background: "#F4F5F7",
  color: "#5E6C84",
  fontSize: 12,
  padding: "4px 10px",
  cursor: "pointer",
  minHeight: 30,
};


// ─── Component ────────────────────────────────────────────────────────────────

type Props = {
  task: Task;
  colKey: Status;
  isFirst: boolean;
  isLast: boolean;
  compactCards: boolean;
  isDragging: boolean;
  nowTs: number;
  showRelativeTimes: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  projectOptions: string[];
  onSetPriority: (priority: Priority) => void;
  onSetProjectDraft: (value: string) => void;
  onSetProject: (value: string) => void;
  onNewProject: (name: string) => void;
  onSetRisk: (risk: NonNullable<Task["risk_state"]>) => void;
  onSetEta: (eta: string) => void;
  onSetBlockedReason: (reason: string) => void;
  onReorderUp: () => void;
  onReorderDown: () => void;
  onDelete: () => void;
};

export default function TaskCard({
  task,
  colKey,
  isFirst,
  isLast,
  compactCards,
  isDragging,
  nowTs,
  showRelativeTimes,
  onDragStart,
  onDragEnd,
  projectOptions,
  onSetPriority,
  onSetProjectDraft,
  onSetProject,
  onNewProject,
  onSetRisk,
  onSetEta,
  onSetBlockedReason,
  onReorderUp,
  onReorderDown,
  onDelete,
}: Props) {
  const [hovered, setHovered] = useState(false);
  const [trashHovered, setTrashHovered] = useState(false);
  const [showPriorityPicker, setShowPriorityPicker] = useState(false);
  const [showNewProjectInput, setShowNewProjectInput] = useState(false);
  const [newProjectDraft, setNewProjectDraft] = useState("");

  // Ensure the task's current project always appears as a selectable option
  // even if it belongs to a completed task (filtered out of the passed list).
  const effectiveProjectOptions = (task.project && !projectOptions.includes(task.project))
    ? [...projectOptions, task.project].sort((a, b) => a.localeCompare(b))
    : projectOptions;

  const saveNewProject = () => {
    const name = newProjectDraft.trim();
    if (name) {
      onSetProjectDraft(name);
      onSetProject(name);
      onNewProject(name);
    }
    setShowNewProjectInput(false);
    setNewProjectDraft("");
  };

  const obj = OBJECTIVE_STYLES[task.objective];
  const priorityColor = PRIORITY_COLORS[task.priority];
  const isCompleted = task.status === "completed";
  const isStale =
    task.status === "in_progress" &&
    !!task.started_at &&
    nowTs - Date.parse(task.started_at) > 48 * 60 * 60 * 1000;

  const cardStyle: React.CSSProperties = {
    background: "#ffffff",
    borderRadius: 8,
    boxShadow: isDragging
      ? "0 8px 24px rgba(0,0,0,0.2)"
      : hovered
        ? "0 4px 12px rgba(0,0,0,0.15)"
        : "0 1px 2px rgba(0,0,0,0.1)",
    transform: isDragging
      ? "rotate(2deg) scale(1.03)"
      : hovered
        ? "translateY(-2px)"
        : "none",
    transition: "box-shadow 0.15s, transform 0.15s",
    opacity: isCompleted ? 0.8 : 1,
    cursor: isDragging ? "grabbing" : "grab",
    display: "flex",
    flexDirection: "row",
    position: "relative",
    overflow: "hidden",
  };

  const gap = compactCards ? 6 : 8;

  return (
    <article
      draggable
      onDragStart={(e) => { e.dataTransfer.setData("text/task-id", task.id); onDragStart(); }}
      onDragEnd={onDragEnd}
      onDragOver={(e) => e.preventDefault()}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={cardStyle}
    >
      {/* ── Six-dot grip handle (backlog only, visible on hover) ── */}
      {colKey === "backlog" && (
        <div
          style={{
            width: 20,
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "8px 0 0 8px",
            cursor: "grab",
            opacity: hovered ? 1 : 0,
            transition: "opacity 0.15s",
            background: hovered ? "rgba(0,0,0,0.04)" : "transparent",
          }}
        >
          <svg width="10" height="16" viewBox="0 0 10 16" fill="none" aria-hidden="true">
            <circle cx="3" cy="3"  r="1.5" fill="#5E6C84" />
            <circle cx="7" cy="3"  r="1.5" fill="#5E6C84" />
            <circle cx="3" cy="8"  r="1.5" fill="#5E6C84" />
            <circle cx="7" cy="8"  r="1.5" fill="#5E6C84" />
            <circle cx="3" cy="13" r="1.5" fill="#5E6C84" />
            <circle cx="7" cy="13" r="1.5" fill="#5E6C84" />
          </svg>
        </div>
      )}

      {/* ── Card content ── */}
      <div style={{ flex: 1, minWidth: 0 }}>

      {/* ── Color label strips — hidden in compact mode ── */}
      {!compactCards && (
        <div style={{ display: "flex", gap: 4, padding: "8px 10px 0" }}>
          <div style={{ height: 8, minWidth: 40, flex: 1, borderRadius: 4, background: obj.stripColor }} />
          <div style={{ height: 8, minWidth: 40, flex: 1, borderRadius: 4, background: priorityColor }} />
        </div>
      )}

      {/* ── Card body ── */}
      {/* In compact mode add right padding to keep title text clear of the trash icon */}
      <div style={{ padding: compactCards ? "6px 30px 6px 10px" : "8px 10px 10px", display: "flex", flexDirection: "column", gap }}>

        {/* Title row */}
        <p style={{ fontSize: 14, fontWeight: 600, color: "#172B4D", lineHeight: 1.3, margin: 0 }}>
          {task.title}
        </p>

        {/* Meta row: priority pill + objective tag + badges — hidden in compact mode */}
        {!compactCards && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, alignItems: "center" }}>
            {/* Priority pill — click to change */}
            <div style={{ position: "relative", display: "inline-flex" }}>
              <button
                onClick={(e) => { e.stopPropagation(); setShowPriorityPicker((v) => !v); }}
                style={{
                  fontSize: 10, fontWeight: 700, color: "#fff",
                  background: priorityColor, borderRadius: 3, padding: "2px 6px",
                  border: "none", cursor: "pointer",
                  boxShadow: showPriorityPicker ? "0 0 0 2px rgba(255,255,255,0.6), 0 0 0 3px rgba(0,0,0,0.25)" : "none",
                  transition: "box-shadow 0.1s, filter 0.1s",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.filter = "brightness(1.15)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.filter = ""; }}
              >
                {task.priority}
              </button>
              {showPriorityPicker && (
                <>
                  <div
                    style={{ position: "fixed", inset: 0, zIndex: 100 }}
                    onClick={() => setShowPriorityPicker(false)}
                  />
                  <div style={{
                    position: "absolute",
                    top: "calc(100% + 5px)",
                    left: 0,
                    zIndex: 101,
                    background: "#fff",
                    border: "1px solid #DFE1E6",
                    borderRadius: 6,
                    padding: 5,
                    display: "flex",
                    flexDirection: "column",
                    gap: 4,
                    boxShadow: "0 4px 14px rgba(0,0,0,0.15)",
                    minWidth: 48,
                  }}>
                    {PRIORITIES.map((p) => (
                      <button
                        key={p}
                        onClick={(e) => { e.stopPropagation(); onSetPriority(p); setShowPriorityPicker(false); }}
                        style={{
                          background: PRIORITY_COLORS[p],
                          color: "#fff",
                          border: p === task.priority ? "2px solid rgba(0,0,0,0.25)" : "2px solid transparent",
                          borderRadius: 3,
                          fontSize: 10,
                          fontWeight: 700,
                          padding: "3px 8px",
                          cursor: "pointer",
                          textAlign: "center",
                          opacity: p === task.priority ? 1 : 0.8,
                        }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = p === task.priority ? "1" : "0.8"; }}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Objective tag */}
            <span style={{
              fontSize: 10, fontWeight: 600,
              background: obj.tagBg, color: obj.tagText,
              borderRadius: 3, padding: "2px 6px",
            }}>
              {obj.label}
            </span>

            {/* Risk badges */}
            {task.risk_state === "at_risk" && (
              <span style={{ fontSize: 10, fontWeight: 600, background: "#FFEBE6", color: "#BF2600", borderRadius: 3, padding: "2px 6px" }}>AT RISK</span>
            )}
            {task.risk_state === "watch" && (
              <span style={{ fontSize: 10, fontWeight: 600, background: "#FFFAE6", color: "#974F0C", borderRadius: 3, padding: "2px 6px" }}>WATCH</span>
            )}
            {(task.blocked_reason ?? "").trim() && (
              <span style={{ fontSize: 10, fontWeight: 600, background: "#EAE6FF", color: "#403294", borderRadius: 3, padding: "2px 6px" }}>BLOCKED</span>
            )}

            {/* ETA badge */}
            {task.eta && (
              <span style={{ fontSize: 10, fontWeight: 600, background: "#E6F0FF", color: "#0052CC", borderRadius: 3, padding: "2px 6px" }}>
                ETA {new Date(task.eta).toLocaleDateString()}
              </span>
            )}

            {/* Stale badge */}
            {isStale && (
              <span style={{ fontSize: 10, fontWeight: 600, background: "#FFF3E0", color: "#BF360C", borderRadius: 3, padding: "2px 6px" }}>STALE &gt;48H</span>
            )}
          </div>
        )}

        {/* ── Controls — hidden in compact mode ── */}
        {!compactCards && (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
              <label style={labelStyle}>Project</label>
              {showNewProjectInput ? (
                <>
                  <input
                    autoFocus
                    value={newProjectDraft}
                    onChange={(e) => setNewProjectDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") { e.preventDefault(); saveNewProject(); }
                      if (e.key === "Escape") { setShowNewProjectInput(false); setNewProjectDraft(""); }
                    }}
                    placeholder="New project name"
                    style={{ ...inputStyle, flex: 1, minWidth: 0 }}
                  />
                  <button onClick={saveNewProject} style={{ ...actionBtnStyle, padding: "2px 8px", fontSize: 11, flexShrink: 0 }}>Save</button>
                  <button onClick={() => { setShowNewProjectInput(false); setNewProjectDraft(""); }} style={{ ...actionBtnStyle, padding: "2px 8px", fontSize: 11, flexShrink: 0 }}>✕</button>
                </>
              ) : (
                <select
                  value={task.project ?? ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === "__create__") { setShowNewProjectInput(true); setNewProjectDraft(""); return; }
                    onSetProjectDraft(v);
                    onSetProject(v);
                  }}
                  style={{ ...inputStyle, flex: 1, minWidth: 0 }}
                >
                  <option value="">— no project —</option>
                  {effectiveProjectOptions.map((p) => <option key={p} value={p}>{p}</option>)}
                  <option value="__create__">+ Create New Project</option>
                </select>
              )}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                <label style={labelStyle}>Risk</label>
                <select
                  value={task.risk_state ?? "normal"}
                  onChange={(e) => onSetRisk(e.target.value as NonNullable<Task["risk_state"]>)}
                  style={{ ...inputStyle, width: "auto", flex: 1, minWidth: 0 }}
                >
                  {RISK_STATES.map((r) => <option key={r} value={r}>{{ normal: "Normal", watch: "Watch", at_risk: "At Risk", blocked: "Blocked" }[r]}</option>)}
                </select>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0, overflow: "hidden" }}>
                <label style={labelStyle}>ETA</label>
                <input
                  type="datetime-local"
                  defaultValue={task.eta ? task.eta.slice(0, 16) : ""}
                  onBlur={(e) => {
                    const v = e.currentTarget.value;
                    onSetEta(v ? new Date(v).toISOString() : "");
                  }}
                  style={{ ...inputStyle, flex: 1, minWidth: 0, maxWidth: "100%" }}
                />
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
              <label style={{ ...labelStyle, marginTop: 3 }}>Blocker</label>
              <input
                defaultValue={task.blocked_reason ?? ""}
                onBlur={(e) => onSetBlockedReason(e.currentTarget.value.trim())}
                placeholder="Optional blocked reason"
                style={inputStyle}
              />
            </div>
          </>
        )}

        {/* Relative times */}
        {showRelativeTimes && (
          <p style={{ fontSize: 11, color: "#5E6C84", margin: 0 }}>
            Updated {formatRelative(task.updated_at, nowTs)} · Created {formatRelative(task.created_at, nowTs)}
          </p>
        )}

        {/* Reorder buttons — backlog only, hidden in compact mode */}
        {!compactCards && colKey === "backlog" && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            <button style={actionBtnStyle} onClick={onReorderUp} disabled={isFirst}>↑</button>
            <button style={actionBtnStyle} onClick={onReorderDown} disabled={isLast}>↓</button>
          </div>
        )}
      </div>
      </div>{/* end card content */}

      {/* Trash icon — bottom-right of card */}
      <button
        onClick={onDelete}
        onMouseEnter={() => setTrashHovered(true)}
        onMouseLeave={() => setTrashHovered(false)}
        style={{
          position: "absolute",
          bottom: 8,
          right: 8,
          background: "none",
          border: "none",
          padding: 2,
          cursor: "pointer",
          color: "#EB5A46",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform: trashHovered ? "scale(1.2)" : "scale(1)",
          filter: trashHovered ? "brightness(0.8)" : "none",
          transition: "transform 0.12s, filter 0.12s",
        }}
        aria-label="Delete task"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 5h12M7 5V3.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5V5M7.5 8.5v5M10.5 8.5v5M4 5l.8 9.2A1 1 0 0 0 5.8 15h6.4a1 1 0 0 0 1-.8L14 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
    </article>
  );
}
