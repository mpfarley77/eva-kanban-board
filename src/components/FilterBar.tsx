import type { RefObject } from "react";
import { OBJECTIVES, PRIORITIES } from "./types";
import type { Objective, Priority, Status, Task } from "./types";

type RiskSummary = {
  atRisk: number;
  watch: number;
  normal: number;
  dueSoon: number;
  blocked: number;
  staleInProgress: number;
};

type Props = {
  // Refs
  titleInputRef: RefObject<HTMLInputElement | null>;
  searchInputRef: RefObject<HTMLInputElement | null>;
  // Add task form
  title: string;
  setTitle: (v: string) => void;
  project: string;
  setProject: (v: string) => void;
  objective: Objective;
  setObjective: (v: Objective) => void;
  priority: Priority;
  setPriority: (v: Priority) => void;
  onAddTask: () => void;
  onResetDraft: () => void;
  // Search and filters
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  projectFilter: string;
  setProjectFilter: (v: string) => void;
  projectOptions: string[];
  objectiveFilter: Objective | "all";
  setObjectiveFilter: (v: Objective | "all") => void;
  riskFilter: "all" | "normal" | "watch" | "at_risk" | "blocked";
  setRiskFilter: (v: "all" | "normal" | "watch" | "at_risk" | "blocked") => void;
  timeFilter: "all" | "due_24h" | "stale_in_progress";
  setTimeFilter: (v: "all" | "due_24h" | "stale_in_progress") => void;
  // Display preferences
  confirmDelete: boolean;
  setConfirmDelete: (v: boolean) => void;
  showRelativeTimes: boolean;
  setShowRelativeTimes: (v: boolean) => void;
  showActivityPanel: boolean;
  setShowActivityPanel: (v: boolean) => void;
  compactCards: boolean;
  setCompactCards: (v: boolean) => void;
  showBackgroundPanel: boolean;
  setShowBackgroundPanel: (v: boolean) => void;
  showTopUrgentPanel: boolean;
  setShowTopUrgentPanel: (v: boolean) => void;
  showTipsPanel: boolean;
  setShowTipsPanel: (v: boolean) => void;
  // Risk summary
  riskSummary: RiskSummary;
  topUrgentTasks: Task[];
  visibleCount: number;
  totalCount: number;
  onMoveTask: (taskId: string, status: Status) => void;
  error: string | null;
};

export default function FilterBar({
  titleInputRef,
  searchInputRef,
  title,
  setTitle,
  project,
  setProject,
  objective,
  setObjective,
  priority,
  setPriority,
  onAddTask,
  onResetDraft,
  searchQuery,
  setSearchQuery,
  projectFilter,
  setProjectFilter,
  projectOptions,
  objectiveFilter,
  setObjectiveFilter,
  riskFilter,
  setRiskFilter,
  timeFilter,
  setTimeFilter,
  confirmDelete,
  setConfirmDelete,
  showRelativeTimes,
  setShowRelativeTimes,
  showActivityPanel,
  setShowActivityPanel,
  compactCards,
  setCompactCards,
  showBackgroundPanel,
  setShowBackgroundPanel,
  showTopUrgentPanel,
  setShowTopUrgentPanel,
  showTipsPanel,
  setShowTipsPanel,
  riskSummary,
  topUrgentTasks,
  visibleCount,
  totalCount,
  onMoveTask,
  error,
}: Props) {
  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900 p-4 space-y-3">
      <h2 className="font-semibold">Add Task</h2>
      <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
        <input
          ref={titleInputRef}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onAddTask();
            }
          }}
          placeholder="Task title"
          className="md:col-span-2 min-h-11 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
        />
        <input
          value={project}
          onChange={(e) => setProject(e.target.value)}
          placeholder="Project (optional)"
          className="min-h-11 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
        />
        <select
          value={objective}
          onChange={(e) => setObjective(e.target.value as Objective)}
          className="min-h-11 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
        >
          {OBJECTIVES.map((o) => (
            <option key={o.key} value={o.key}>{o.label}</option>
          ))}
        </select>
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value as Priority)}
          className="min-h-11 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
        >
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <button
          onClick={onAddTask}
          disabled={!title.trim()}
          className="min-h-11 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50 px-4 py-2 font-medium"
        >
          Create
        </button>
        <button
          onClick={onResetDraft}
          className="min-h-11 rounded-lg border border-slate-700 px-4 py-2 font-medium hover:bg-slate-800"
        >
          Reset Draft
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <input
          ref={searchInputRef}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search title/project/blocker (press /)"
          className="min-h-9 rounded border border-slate-700 bg-slate-950 px-2 py-1 text-sm"
        />
        {searchQuery ? (
          <button
            className="rounded border border-slate-700 px-2 py-1 text-xs hover:bg-slate-800"
            onClick={() => {
              setSearchQuery("");
              searchInputRef.current?.focus();
            }}
          >
            Clear search
          </button>
        ) : null}

        <label className="text-slate-400">Project view</label>
        <select
          value={projectFilter}
          onChange={(e) => setProjectFilter(e.target.value)}
          className="rounded border border-slate-700 bg-slate-950 px-2 py-1"
        >
          <option value="all">All projects</option>
          {projectOptions.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>

        <label className="ml-0 sm:ml-3 text-slate-400">Objective</label>
        <select
          value={objectiveFilter}
          onChange={(e) => setObjectiveFilter(e.target.value as Objective | "all")}
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
          onChange={(e) => setRiskFilter(e.target.value as "all" | "normal" | "watch" | "at_risk" | "blocked")}
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
          onChange={(e) => setTimeFilter(e.target.value as "all" | "due_24h" | "stale_in_progress")}
          className="rounded border border-slate-700 bg-slate-950 px-2 py-1"
        >
          <option value="all">All time</option>
          <option value="due_24h">Due &lt; 24h</option>
          <option value="stale_in_progress">Stale in-progress</option>
        </select>

        <button
          className="rounded border border-slate-700 px-2 py-1 text-xs hover:bg-slate-800"
          onClick={() => {
            setProjectFilter("all");
            setObjectiveFilter("all");
            setRiskFilter("all");
            setTimeFilter("all");
            setSearchQuery("");
          }}
        >
          Clear filters
        </button>

        <label className="ml-0 sm:ml-3 flex items-center gap-2 text-slate-400 text-xs">
          <input
            type="checkbox"
            checked={confirmDelete}
            onChange={(e) => setConfirmDelete(e.target.checked)}
          />
          Confirm delete
        </label>

        <label className="flex items-center gap-2 text-slate-400 text-xs">
          <input
            type="checkbox"
            checked={showRelativeTimes}
            onChange={(e) => setShowRelativeTimes(e.target.checked)}
          />
          Show relative times
        </label>

        <label className="flex items-center gap-2 text-slate-400 text-xs">
          <input
            type="checkbox"
            checked={showActivityPanel}
            onChange={(e) => setShowActivityPanel(e.target.checked)}
          />
          Show activity panel
        </label>

        <label className="flex items-center gap-2 text-slate-400 text-xs">
          <input
            type="checkbox"
            checked={compactCards}
            onChange={(e) => setCompactCards(e.target.checked)}
          />
          Compact cards
        </label>

        <label className="flex items-center gap-2 text-slate-400 text-xs">
          <input
            type="checkbox"
            checked={showBackgroundPanel}
            onChange={(e) => setShowBackgroundPanel(e.target.checked)}
          />
          Show background panel
        </label>

        <label className="flex items-center gap-2 text-slate-400 text-xs">
          <input
            type="checkbox"
            checked={showTopUrgentPanel}
            onChange={(e) => setShowTopUrgentPanel(e.target.checked)}
          />
          Show top urgent panel
        </label>

        <label className="flex items-center gap-2 text-slate-400 text-xs">
          <input
            type="checkbox"
            checked={showTipsPanel}
            onChange={(e) => setShowTipsPanel(e.target.checked)}
          />
          Show tips panel
        </label>
      </div>

      <p className="text-xs text-slate-400">
        WIP limit active: max 1 task in "In Progress". Drag and drop cards between columns is enabled.
      </p>
      <p className="text-xs text-slate-500">
        Showing {visibleCount} of {totalCount} tasks with active filters.
      </p>

      <div className="flex flex-wrap gap-2 text-xs">
        <button
          className="rounded-full border border-red-700/60 bg-red-950/40 px-2 py-1 text-red-200 hover:bg-red-900/40"
          onClick={() => setRiskFilter("at_risk")}
        >
          At risk: {riskSummary.atRisk}
        </button>
        <button
          className="rounded-full border border-amber-700/60 bg-amber-950/40 px-2 py-1 text-amber-200 hover:bg-amber-900/40"
          onClick={() => setRiskFilter("normal")}
        >
          Normal: {riskSummary.normal}
        </button>
        <button
          className="rounded-full border border-yellow-700/60 bg-yellow-950/40 px-2 py-1 text-yellow-200 hover:bg-yellow-900/40"
          onClick={() => setRiskFilter("watch")}
        >
          Watch: {riskSummary.watch}
        </button>
        <button
          className="rounded-full border border-sky-700/60 bg-sky-950/40 px-2 py-1 text-sky-200 hover:bg-sky-900/40"
          onClick={() => setTimeFilter("due_24h")}
        >
          Due &lt; 24h: {riskSummary.dueSoon}
        </button>
        <button
          className="rounded-full border border-purple-700/60 bg-purple-950/40 px-2 py-1 text-purple-200 hover:bg-purple-900/40"
          onClick={() => setRiskFilter("blocked")}
        >
          Blocked: {riskSummary.blocked}
        </button>
        <button
          className="rounded-full border border-orange-700/60 bg-orange-950/40 px-2 py-1 text-orange-200 hover:bg-orange-900/40"
          onClick={() => setTimeFilter("stale_in_progress")}
        >
          Stale in-progress (&gt;48h): {riskSummary.staleInProgress}
        </button>
        {riskFilter !== "all" ? (
          <button
            className="rounded-full border border-slate-600 px-2 py-1 text-slate-300 hover:bg-slate-800"
            onClick={() => setRiskFilter("all")}
          >
            Clear risk filter
          </button>
        ) : null}
        {timeFilter !== "all" ? (
          <button
            className="rounded-full border border-slate-600 px-2 py-1 text-slate-300 hover:bg-slate-800"
            onClick={() => setTimeFilter("all")}
          >
            Clear time filter
          </button>
        ) : null}
      </div>

      {showTopUrgentPanel ? (
        <div className="rounded-lg border border-slate-800 bg-slate-950 p-3">
          <p className="text-xs font-semibold text-slate-300 mb-2">Top Urgent (filtered view)</p>
          {topUrgentTasks.length === 0 ? (
            <p className="text-xs text-slate-500">No urgent tasks in current view.</p>
          ) : (
            <ul className="space-y-1 text-xs text-slate-300">
              {topUrgentTasks.map((t) => (
                <li key={t.id} className="flex items-center gap-2">
                  <button
                    className="flex-1 truncate text-left hover:text-white"
                    onClick={() => {
                      setSearchQuery(t.title);
                      searchInputRef.current?.focus();
                    }}
                  >
                    • {t.title} [{t.priority}] ({t.status})
                  </button>
                  {t.status !== "in_progress" && t.status !== "completed" ? (
                    <button
                      className="rounded border border-blue-700 px-2 py-0.5 text-[10px] text-blue-200 hover:bg-blue-900/30"
                      onClick={() => onMoveTask(t.id, "in_progress")}
                    >
                      Start
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}

      {error ? <p className="text-red-400 text-sm">{error}</p> : null}
    </section>
  );
}
