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
  showActivityPanel: boolean;
  onShowActivityPanelChange: (v: boolean) => void;
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
  showActivityPanel,
  onShowActivityPanelChange,
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
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <input
          ref={searchInputRef}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search title/project/blocker (press /)"
          className="min-h-9 rounded border border-slate-700 bg-slate-950 px-2 py-1 text-sm"
        />
        {searchQuery ? (
          <button
            className="rounded border border-slate-700 px-2 py-1 text-xs hover:bg-slate-800"
            onClick={() => {
              onSearchChange("");
              searchInputRef.current?.focus();
            }}
          >
            Clear search
          </button>
        ) : null}

        <label className="text-slate-400">Project view</label>
        <select value={projectFilter} onChange={(e) => onProjectFilterChange(e.target.value)} className="rounded border border-slate-700 bg-slate-950 px-2 py-1">
          <option value="all">All projects</option>
          {projectOptions.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>

        <label className="ml-0 sm:ml-3 text-slate-400">Objective</label>
        <select
          value={objectiveFilter}
          onChange={(e) => onObjectiveFilterChange(e.target.value as Objective | "all")}
          className="rounded border border-slate-700 bg-slate-950 px-2 py-1"
        >
          <option value="all">All objectives</option>
          {OBJECTIVES.map((o) => (
            <option key={o.key} value={o.key}>{o.label}</option>
          ))}
        </select>

        <label className="ml-0 sm:ml-3 text-slate-400">Risk</label>
        <select
          value={riskFilter}
          onChange={(e) => onRiskFilterChange(e.target.value as RiskFilter)}
          className="rounded border border-slate-700 bg-slate-950 px-2 py-1"
        >
          <option value="all">All risk</option>
          <option value="normal">Normal</option>
          <option value="watch">Watch</option>
          <option value="at_risk">At risk</option>
          <option value="blocked">Blocked</option>
        </select>

        <label className="ml-0 sm:ml-3 text-slate-400">Time</label>
        <select
          value={timeFilter}
          onChange={(e) => onTimeFilterChange(e.target.value as TimeFilter)}
          className="rounded border border-slate-700 bg-slate-950 px-2 py-1"
        >
          <option value="all">All time</option>
          <option value="due_24h">Due &lt; 24h</option>
          <option value="stale_in_progress">Stale in-progress</option>
        </select>

        <button
          className="rounded border border-slate-700 px-2 py-1 text-xs hover:bg-slate-800"
          onClick={() => {
            onProjectFilterChange("all");
            onObjectiveFilterChange("all");
            onRiskFilterChange("all");
            onTimeFilterChange("all");
            onSearchChange("");
          }}
        >
          Clear filters
        </button>

        <label className="ml-0 sm:ml-3 flex items-center gap-2 text-slate-400 text-xs">
          <input
            type="checkbox"
            checked={confirmDelete}
            onChange={(e) => onConfirmDeleteChange(e.target.checked)}
          />
          Confirm delete
        </label>

        <label className="flex items-center gap-2 text-slate-400 text-xs">
          <input
            type="checkbox"
            checked={showRelativeTimes}
            onChange={(e) => onShowRelativeTimesChange(e.target.checked)}
          />
          Show relative times
        </label>

        <label className="flex items-center gap-2 text-slate-400 text-xs">
          <input
            type="checkbox"
            checked={showActivityPanel}
            onChange={(e) => onShowActivityPanelChange(e.target.checked)}
          />
          Show activity panel
        </label>

        <label className="flex items-center gap-2 text-slate-400 text-xs">
          <input
            type="checkbox"
            checked={compactCards}
            onChange={(e) => onCompactCardsChange(e.target.checked)}
          />
          Compact cards
        </label>

        <label className="flex items-center gap-2 text-slate-400 text-xs">
          <input
            type="checkbox"
            checked={showBackgroundPanel}
            onChange={(e) => onShowBackgroundPanelChange(e.target.checked)}
          />
          Show background panel
        </label>

        <label className="flex items-center gap-2 text-slate-400 text-xs">
          <input
            type="checkbox"
            checked={showTopUrgentPanel}
            onChange={(e) => onShowTopUrgentPanelChange(e.target.checked)}
          />
          Show top urgent panel
        </label>

        <label className="flex items-center gap-2 text-slate-400 text-xs">
          <input
            type="checkbox"
            checked={showTipsPanel}
            onChange={(e) => onShowTipsPanelChange(e.target.checked)}
          />
          Show tips panel
        </label>
      </div>
      <p className="text-xs text-slate-400">WIP limit active: max 1 task in "In Progress". Drag and drop cards between columns is enabled.</p>
      <p className="text-xs text-slate-500">Showing {visibleCount} of {totalCount} tasks with active filters.</p>
      <div className="flex flex-wrap gap-2 text-xs">
        <button
          className="rounded-full border border-red-700/60 bg-red-950/40 px-2 py-1 text-red-200 hover:bg-red-900/40"
          onClick={() => onRiskFilterChange("at_risk")}
        >
          At risk: {riskSummary.atRisk}
        </button>
        <button
          className="rounded-full border border-amber-700/60 bg-amber-950/40 px-2 py-1 text-amber-200 hover:bg-amber-900/40"
          onClick={() => onRiskFilterChange("normal")}
        >
          Normal: {riskSummary.normal}
        </button>
        <button
          className="rounded-full border border-yellow-700/60 bg-yellow-950/40 px-2 py-1 text-yellow-200 hover:bg-yellow-900/40"
          onClick={() => onRiskFilterChange("watch")}
        >
          Watch: {riskSummary.watch}
        </button>
        <button
          className="rounded-full border border-sky-700/60 bg-sky-950/40 px-2 py-1 text-sky-200 hover:bg-sky-900/40"
          onClick={() => onTimeFilterChange("due_24h")}
        >
          Due &lt; 24h: {riskSummary.dueSoon}
        </button>
        <button
          className="rounded-full border border-purple-700/60 bg-purple-950/40 px-2 py-1 text-purple-200 hover:bg-purple-900/40"
          onClick={() => onRiskFilterChange("blocked")}
        >
          Blocked: {riskSummary.blocked}
        </button>
        <button
          className="rounded-full border border-orange-700/60 bg-orange-950/40 px-2 py-1 text-orange-200 hover:bg-orange-900/40"
          onClick={() => onTimeFilterChange("stale_in_progress")}
        >
          Stale in-progress (&gt;48h): {riskSummary.staleInProgress}
        </button>
        {riskFilter !== "all" ? (
          <button
            className="rounded-full border border-slate-600 px-2 py-1 text-slate-300 hover:bg-slate-800"
            onClick={() => onRiskFilterChange("all")}
          >
            Clear risk filter
          </button>
        ) : null}
        {timeFilter !== "all" ? (
          <button
            className="rounded-full border border-slate-600 px-2 py-1 text-slate-300 hover:bg-slate-800"
            onClick={() => onTimeFilterChange("all")}
          >
            Clear time filter
          </button>
        ) : null}
      </div>
    </>
  );
}
