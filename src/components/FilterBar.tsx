"use client";

import { RefObject } from "react";
import { type Objective, OBJECTIVES } from "./types";

type RiskFilter = "all" | "normal" | "watch" | "at_risk" | "blocked";
type TimeFilter = "all" | "due_24h" | "stale_in_progress";

export type RiskSummary = {
  atRisk: number;
  watch: number;
  normal: number;
  dueSoon: number;
  blocked: number;
  staleInProgress: number;
};

type Props = {
  searchQuery: string;
  onSearchChange: (v: string) => void;
  searchInputRef: RefObject<HTMLInputElement | null>;
  projectFilter: string;
  onProjectFilterChange: (v: string) => void;
  projectOptions: string[];
  objectiveFilter: Objective | "all";
  onObjectiveFilterChange: (v: Objective | "all") => void;
  riskFilter: RiskFilter;
  onRiskFilterChange: (v: RiskFilter) => void;
  timeFilter: TimeFilter;
  onTimeFilterChange: (v: TimeFilter) => void;
  confirmDelete: boolean;
  onConfirmDeleteChange: (v: boolean) => void;
  showRelativeTimes: boolean;
  onShowRelativeTimesChange: (v: boolean) => void;
  compactCards: boolean;
  onCompactCardsChange: (v: boolean) => void;
  showBackgroundPanel: boolean;
  onShowBackgroundPanelChange: (v: boolean) => void;
  showTopUrgentPanel: boolean;
  onShowTopUrgentPanelChange: (v: boolean) => void;
  showTipsPanel: boolean;
  onShowTipsPanelChange: (v: boolean) => void;
  visibleCount: number;
  totalCount: number;
  riskSummary: RiskSummary;
};

// ─── Style tokens ─────────────────────────────────────────────────────────────

const ctrl: React.CSSProperties = {
  background: "#FAFBFC",
  border: "1px solid #DFE1E6",
  borderRadius: 4,
  color: "#172B4D",
  fontSize: 13,
  padding: "4px 8px",
  height: 32,
};

const lbl: React.CSSProperties = {
  fontSize: 13,
  color: "#5E6C84",
  whiteSpace: "nowrap",
};

const clearBtn: React.CSSProperties = {
  background: "#F4F5F7",
  border: "1px solid #DFE1E6",
  borderRadius: 4,
  color: "#5E6C84",
  fontSize: 12,
  padding: "4px 10px",
  cursor: "pointer",
  height: 32,
};

type PillStyle = { bg: string; text: string; border: string };

const PILLS: Record<string, PillStyle> = {
  atRisk:          { bg: "#FFEBE6", text: "#BF2600", border: "#FFBDAD" },
  normal:          { bg: "#EEF6EC", text: "#519839", border: "#ABE2A8" },
  watch:           { bg: "#FFFAE6", text: "#974F0C", border: "#FFE380" },
  dueSoon:         { bg: "#E6F0FF", text: "#0052CC", border: "#B3D4FF" },
  blocked:         { bg: "#EAE6FF", text: "#403294", border: "#C0B6F2" },
  staleInProgress: { bg: "#FFF3E0", text: "#BF360C", border: "#FFD5B1" },
  clear:           { bg: "#F4F5F7", text: "#5E6C84", border: "#DFE1E6" },
};

function pill(key: string, label: string, onClick: () => void) {
  const s = PILLS[key];
  return (
    <button
      key={key}
      onClick={onClick}
      style={{
        background: s.bg,
        color: s.text,
        border: `1px solid ${s.border}`,
        borderRadius: 20,
        fontSize: 12,
        fontWeight: 600,
        padding: "3px 10px",
        cursor: "pointer",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </button>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function FilterBar({
  searchQuery,
  onSearchChange,
  searchInputRef,
  projectFilter,
  onProjectFilterChange,
  projectOptions,
  objectiveFilter,
  onObjectiveFilterChange,
  riskFilter,
  onRiskFilterChange,
  timeFilter,
  onTimeFilterChange,
  confirmDelete,
  onConfirmDeleteChange,
  showRelativeTimes,
  onShowRelativeTimesChange,
  compactCards,
  onCompactCardsChange,
  showBackgroundPanel,
  onShowBackgroundPanelChange,
  showTopUrgentPanel,
  onShowTopUrgentPanelChange,
  showTipsPanel,
  onShowTipsPanelChange,
  visibleCount,
  totalCount,
  riskSummary,
}: Props) {
  return (
    <>
      {/* ── Filter controls row ── */}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
        <input
          ref={searchInputRef}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search title/project/blocker (press /)"
          style={{ ...ctrl, width: 260 }}
        />
        {searchQuery && (
          <button style={clearBtn} onClick={() => { onSearchChange(""); searchInputRef.current?.focus(); }}>
            Clear search
          </button>
        )}

        <span style={lbl}>Project</span>
        <select value={projectFilter} onChange={(e) => onProjectFilterChange(e.target.value)} style={ctrl}>
          <option value="all">All projects</option>
          {projectOptions.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>

        <span style={lbl}>Objective</span>
        <select value={objectiveFilter} onChange={(e) => onObjectiveFilterChange(e.target.value as Objective | "all")} style={ctrl}>
          <option value="all">All objectives</option>
          {OBJECTIVES.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
        </select>

        <span style={lbl}>Risk</span>
        <select value={riskFilter} onChange={(e) => onRiskFilterChange(e.target.value as RiskFilter)} style={ctrl}>
          <option value="all">All risk</option>
          <option value="normal">Normal</option>
          <option value="watch">Watch</option>
          <option value="at_risk">At risk</option>
          <option value="blocked">Blocked</option>
        </select>

        <span style={lbl}>Time</span>
        <select value={timeFilter} onChange={(e) => onTimeFilterChange(e.target.value as TimeFilter)} style={ctrl}>
          <option value="all">All time</option>
          <option value="due_24h">Due &lt; 24h</option>
          <option value="stale_in_progress">Stale in-progress</option>
        </select>

        <button style={clearBtn} onClick={() => { onProjectFilterChange("all"); onObjectiveFilterChange("all"); onRiskFilterChange("all"); onTimeFilterChange("all"); onSearchChange(""); }}>
          Clear filters
        </button>
      </div>

      {/* ── Display toggles ── */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
        {(
          [
            { checked: confirmDelete,       onChange: onConfirmDeleteChange,       label: "Confirm delete" },
            { checked: showRelativeTimes,   onChange: onShowRelativeTimesChange,   label: "Relative times" },
            { checked: compactCards,        onChange: onCompactCardsChange,        label: "Compact cards" },
            { checked: showBackgroundPanel, onChange: onShowBackgroundPanelChange, label: "Background panel" },
            { checked: showTopUrgentPanel,  onChange: onShowTopUrgentPanelChange,  label: "Top urgent" },
            { checked: showTipsPanel,       onChange: onShowTipsPanelChange,       label: "Tips" },
          ] satisfies { checked: boolean; onChange: (v: boolean) => void; label: string }[]
        ).map(({ checked, onChange, label }) => (
          <label key={label} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "#5E6C84", cursor: "pointer" }}>
            <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
            {label}
          </label>
        ))}
      </div>

      {/* ── Info lines ── */}
      <p style={{ fontSize: 12, color: "#7A869A", margin: 0 }}>
        Showing {visibleCount} of {totalCount} tasks with active filters.
      </p>

      {/* ── Risk summary pills ── */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {pill("atRisk",          `At risk: ${riskSummary.atRisk}`,                   () => onRiskFilterChange("at_risk"))}
        {pill("normal",          `Normal: ${riskSummary.normal}`,                    () => onRiskFilterChange("normal"))}
        {pill("watch",           `Watch: ${riskSummary.watch}`,                      () => onRiskFilterChange("watch"))}
        {pill("dueSoon",         `Due < 24h: ${riskSummary.dueSoon}`,               () => onTimeFilterChange("due_24h"))}
        {pill("blocked",         `Blocked: ${riskSummary.blocked}`,                  () => onRiskFilterChange("blocked"))}
        {pill("staleInProgress", `Stale >48h: ${riskSummary.staleInProgress}`,      () => onTimeFilterChange("stale_in_progress"))}
        {riskFilter !== "all"  && pill("clear", "Clear risk filter",  () => onRiskFilterChange("all"))}
        {timeFilter !== "all"  && pill("clear", "Clear time filter",  () => onTimeFilterChange("all"))}
      </div>
    </>
  );
}
