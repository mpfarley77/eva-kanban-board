"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  type Objective,
  type Status,
  type Priority,
  type Task,
  type ActivityEvent,
  OBJECTIVES,
  PRIORITIES,
  RISK_STATES,
  COLUMNS,
} from "./types";
import TaskCard from "./TaskCard";
import FilterBar from "./FilterBar";
import ActivityLog from "./ActivityLog";
import KanbanColumn from "./KanbanColumn";

export default function KanbanBoard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState("");
  const [objective, setObjective] = useState<Objective>("skyworks");
  const [project, setProject] = useState("");
  const [priority, setPriority] = useState<Priority>("P2");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string>("");
  const [nowTs, setNowTs] = useState<number>(0);
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [objectiveFilter, setObjectiveFilter] = useState<Objective | "all">("all");
  const [riskFilter, setRiskFilter] = useState<"all" | "normal" | "watch" | "at_risk" | "blocked">("all");
  const [timeFilter, setTimeFilter] = useState<"all" | "due_24h" | "stale_in_progress">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activity, setActivity] = useState<ActivityEvent[]>([]);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const titleInputRef = useRef<HTMLInputElement | null>(null);
  const searchQueryRef = useRef("");
  const [bgImageUrl, setBgImageUrl] = useState("");
  const [bgOverlay, setBgOverlay] = useState(55);
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const [dropColumn, setDropColumn] = useState<Status | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(true);
  const [showRelativeTimes, setShowRelativeTimes] = useState(true);
  const [showActivityPanel, setShowActivityPanel] = useState(true);
  const [compactCards, setCompactCards] = useState(false);
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
  const [showTipsPanel, setShowTipsPanel] = useState(false);
  const [showBackgroundPanel, setShowBackgroundPanel] = useState(true);
  const [showTopUrgentPanel, setShowTopUrgentPanel] = useState(true);

  const loadTasks = async () => {
    const res = await fetch("/api/tasks", { cache: "no-store" });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed to load tasks");
      setLoading(false);
      return;
    }
    setTasks(data.tasks || []);
    setUpdatedAt(new Date().toLocaleTimeString());
    setNowTs(Date.now());
    setLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadTasks();
    const id = setInterval(() => {
      loadTasks();
    }, 30000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const raw = window.localStorage.getItem("kb_activity_v1");
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as ActivityEvent[];
      if (Array.isArray(parsed)) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setActivity(parsed.slice(0, 40));
      }
    } catch {
      // ignore malformed storage
    }
  }, []);

  useEffect(() => {
    const savedUrl = window.localStorage.getItem("kb_bg_image_url") ?? "";
    const savedOverlay = Number(window.localStorage.getItem("kb_bg_overlay") ?? "55");

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setBgImageUrl(savedUrl);
    setBgOverlay(Number.isFinite(savedOverlay) ? Math.min(90, Math.max(0, savedOverlay)) : 55);
  }, []);

  useEffect(() => {
    window.localStorage.setItem("kb_bg_image_url", bgImageUrl);
  }, [bgImageUrl]);

  useEffect(() => {
    window.localStorage.setItem("kb_bg_overlay", String(bgOverlay));
  }, [bgOverlay]);

  useEffect(() => {
    const savedProjectFilter = window.localStorage.getItem("kb_project_filter") ?? "all";
    const savedObjectiveRaw = window.localStorage.getItem("kb_objective_filter") ?? "all";
    const savedRiskRaw = window.localStorage.getItem("kb_risk_filter") ?? "all";
    const savedTimeRaw = window.localStorage.getItem("kb_time_filter") ?? "all";
    const savedSearchQuery = window.localStorage.getItem("kb_search_query") ?? "";
    const savedConfirmDelete = window.localStorage.getItem("kb_confirm_delete") ?? "1";
    const savedRelativeTimes = window.localStorage.getItem("kb_show_relative_times") ?? "1";
    const savedShowActivityPanel = window.localStorage.getItem("kb_show_activity_panel") ?? "1";
    const savedCompactCards = window.localStorage.getItem("kb_compact_cards") ?? "0";
    const savedShowBackgroundPanel = window.localStorage.getItem("kb_show_background_panel") ?? "1";
    const savedShowTopUrgentPanel = window.localStorage.getItem("kb_show_top_urgent_panel") ?? "1";
    const savedShowShortcutsHelp = window.localStorage.getItem("kb_show_shortcuts_help") ?? "0";
    const savedShowTipsPanel = window.localStorage.getItem("kb_show_tips_panel") ?? "0";
    const savedDraftTitle = window.localStorage.getItem("kb_draft_title") ?? "";
    const savedDraftProject = window.localStorage.getItem("kb_draft_project") ?? "";
    const savedDraftObjectiveRaw = window.localStorage.getItem("kb_draft_objective") ?? "skyworks";
    const savedDraftPriorityRaw = window.localStorage.getItem("kb_draft_priority") ?? "P2";

    const allowedObjectives: Array<Objective | "all"> = ["all", "skyworks", "personal", "side_hustles"];
    const allowedRisk: Array<"all" | "normal" | "watch" | "at_risk" | "blocked"> = ["all", "normal", "watch", "at_risk", "blocked"];
    const allowedTime: Array<"all" | "due_24h" | "stale_in_progress"> = ["all", "due_24h", "stale_in_progress"];
    const allowedDraftObjectives: Objective[] = ["skyworks", "personal", "side_hustles"];
    const allowedPriorities: Priority[] = ["P0", "P1", "P2", "P3"];

    const savedObjectiveFilter = allowedObjectives.includes(savedObjectiveRaw as Objective | "all")
      ? (savedObjectiveRaw as Objective | "all")
      : "all";
    const savedRiskFilter = allowedRisk.includes(savedRiskRaw as typeof allowedRisk[number])
      ? (savedRiskRaw as typeof allowedRisk[number])
      : "all";
    const savedTimeFilter = allowedTime.includes(savedTimeRaw as typeof allowedTime[number])
      ? (savedTimeRaw as typeof allowedTime[number])
      : "all";
    const savedDraftObjective = allowedDraftObjectives.includes(savedDraftObjectiveRaw as Objective)
      ? (savedDraftObjectiveRaw as Objective)
      : "skyworks";
    const savedDraftPriority = allowedPriorities.includes(savedDraftPriorityRaw as Priority)
      ? (savedDraftPriorityRaw as Priority)
      : "P2";

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProjectFilter(savedProjectFilter);
    setObjectiveFilter(savedObjectiveFilter);
    setRiskFilter(["all","normal","watch","at_risk","blocked"].includes(savedRiskFilter) ? (savedRiskFilter as "all"|"normal"|"watch"|"at_risk"|"blocked") : "all");
    setTimeFilter(savedTimeFilter);
    setSearchQuery(savedSearchQuery);
    setConfirmDelete(savedConfirmDelete !== "0");
    setShowRelativeTimes(savedRelativeTimes !== "0");
    setShowActivityPanel(savedShowActivityPanel !== "0");
    setCompactCards(savedCompactCards === "1");
    setShowBackgroundPanel(savedShowBackgroundPanel !== "0");
    setShowTopUrgentPanel(savedShowTopUrgentPanel !== "0");
    setShowShortcutsHelp(savedShowShortcutsHelp === "1");
    setShowTipsPanel(savedShowTipsPanel === "1");
    setTitle(savedDraftTitle);
    setProject(savedDraftProject);
    setObjective(savedDraftObjective);
    setPriority(savedDraftPriority);
  }, []);

  useEffect(() => {
    window.localStorage.setItem("kb_project_filter", projectFilter);
  }, [projectFilter]);

  useEffect(() => {
    window.localStorage.setItem("kb_objective_filter", objectiveFilter);
  }, [objectiveFilter]);

  useEffect(() => {
    window.localStorage.setItem("kb_risk_filter", riskFilter);
  }, [riskFilter]);

  useEffect(() => {
    window.localStorage.setItem("kb_time_filter", timeFilter);
  }, [timeFilter]);

  useEffect(() => {
    searchQueryRef.current = searchQuery;
    window.localStorage.setItem("kb_search_query", searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    window.localStorage.setItem("kb_draft_title", title);
  }, [title]);

  useEffect(() => {
    window.localStorage.setItem("kb_draft_project", project);
  }, [project]);

  useEffect(() => {
    window.localStorage.setItem("kb_draft_objective", objective);
  }, [objective]);

  useEffect(() => {
    window.localStorage.setItem("kb_draft_priority", priority);
  }, [priority]);

  useEffect(() => {
    window.localStorage.setItem("kb_confirm_delete", confirmDelete ? "1" : "0");
  }, [confirmDelete]);

  useEffect(() => {
    window.localStorage.setItem("kb_show_relative_times", showRelativeTimes ? "1" : "0");
  }, [showRelativeTimes]);

  useEffect(() => {
    window.localStorage.setItem("kb_show_activity_panel", showActivityPanel ? "1" : "0");
  }, [showActivityPanel]);

  useEffect(() => {
    window.localStorage.setItem("kb_compact_cards", compactCards ? "1" : "0");
  }, [compactCards]);

  useEffect(() => {
    window.localStorage.setItem("kb_show_background_panel", showBackgroundPanel ? "1" : "0");
  }, [showBackgroundPanel]);

  useEffect(() => {
    window.localStorage.setItem("kb_show_top_urgent_panel", showTopUrgentPanel ? "1" : "0");
  }, [showTopUrgentPanel]);

  useEffect(() => {
    window.localStorage.setItem("kb_show_shortcuts_help", showShortcutsHelp ? "1" : "0");
  }, [showShortcutsHelp]);

  useEffect(() => {
    window.localStorage.setItem("kb_show_tips_panel", showTipsPanel ? "1" : "0");
  }, [showTipsPanel]);

  useEffect(() => {
    if (!error) return;
    const id = window.setTimeout(() => setError(null), 6000);
    return () => window.clearTimeout(id);
  }, [error]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      const isTypingContext = tag === "input" || tag === "textarea" || target?.isContentEditable;

      if (e.key === "/") {
        if (isTypingContext) return;
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
        return;
      }

      if (e.key.toLowerCase() === "n") {
        if (isTypingContext) return;
        e.preventDefault();
        titleInputRef.current?.focus();
        titleInputRef.current?.select();
        return;
      }

      if (e.key.toLowerCase() === "r") {
        if (isTypingContext) return;
        e.preventDefault();
        void loadTasks();
        return;
      }


      if (e.key === "Escape" && document.activeElement === searchInputRef.current && searchQueryRef.current) {
        e.preventDefault();
        setSearchQuery("");
        return;
      }

      if (e.key === "?" && !isTypingContext) {
        e.preventDefault();
        setShowShortcutsHelp((prev) => !prev);
        return;
      }

      if (e.key.toLowerCase() === "t" && !isTypingContext) {
        e.preventDefault();
        setShowTipsPanel((prev) => !prev);
        return;
      }

      if (e.key.toLowerCase() === "x" && !isTypingContext) {
        e.preventDefault();
        setProjectFilter("all");
        setObjectiveFilter("all");
        setRiskFilter("all");
        setTimeFilter("all");
        setSearchQuery("");
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const logActivity = (message: string) => {
    const next: ActivityEvent = {
      message,
      at: new Date().toISOString(),
    };

    setActivity((prev) => {
      const updated = [next, ...prev].slice(0, 40);
      window.localStorage.setItem("kb_activity_v1", JSON.stringify(updated));
      return updated;
    });
  };

  const projectOptions = useMemo(() => {
    const names = Array.from(new Set(tasks.map((t) => (t.project ?? "").trim()).filter(Boolean)));
    return names.sort((a, b) => a.localeCompare(b));
  }, [tasks]);

  const visibleTasks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return tasks.filter((t) => {
      const projectMatches = projectFilter === "all" || (t.project ?? "").trim() === projectFilter;
      const objectiveMatches = objectiveFilter === "all" || t.objective === objectiveFilter;
      const riskMatches =
        riskFilter === "all"
          ? true
          : riskFilter === "blocked"
            ? (t.blocked_reason ?? "").trim().length > 0
            : (t.risk_state ?? "normal") === riskFilter;
      const searchMatches =
        !q ||
        t.title.toLowerCase().includes(q) ||
        (t.project ?? "").toLowerCase().includes(q) ||
        (t.blocked_reason ?? "").toLowerCase().includes(q);

      const etaTs = t.eta ? Date.parse(t.eta) : NaN;
      const startedTs = t.started_at ? Date.parse(t.started_at) : NaN;
      const dueSoon = !Number.isNaN(etaTs) && etaTs >= nowTs && etaTs <= nowTs + 24 * 60 * 60 * 1000 && t.status !== "completed";
      const stale = t.status === "in_progress" && !Number.isNaN(startedTs) && nowTs - startedTs > 48 * 60 * 60 * 1000;
      const timeMatches =
        timeFilter === "all" ? true : timeFilter === "due_24h" ? dueSoon : stale;

      return projectMatches && objectiveMatches && riskMatches && searchMatches && timeMatches;
    });
  }, [tasks, projectFilter, objectiveFilter, riskFilter, timeFilter, searchQuery, nowTs]);

  const grouped = useMemo(() => {
    const sorted = [...visibleTasks].sort((a, b) => {
      if (a.status !== b.status) return 0;
      if (a.status === "backlog") {
        return (a.sort_order ?? 9999) - (b.sort_order ?? 9999);
      }
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });

    return COLUMNS.reduce<Record<Status, Task[]>>(
      (acc, col) => ({ ...acc, [col.key]: sorted.filter((t) => t.status === col.key) }),
      { backlog: [], in_progress: [], review: [], completed: [] }
    );
  }, [visibleTasks]);

  const inProgressCount = grouped.in_progress.length;

  const riskSummary = useMemo(() => {
    const inScope = visibleTasks;
    const atRisk = inScope.filter((t) => t.risk_state === "at_risk").length;
    const watch = inScope.filter((t) => t.risk_state === "watch").length;
    const normal = inScope.filter((t) => (t.risk_state ?? "normal") === "normal").length;
    const dueSoon = inScope.filter((t) => {
      if (!t.eta) return false;
      const etaTs = Date.parse(t.eta);
      if (Number.isNaN(etaTs)) return false;
      const next24h = nowTs + 24 * 60 * 60 * 1000;
      return etaTs >= nowTs && etaTs <= next24h && t.status !== "completed";
    }).length;
    const blocked = inScope.filter((t) => (t.blocked_reason ?? "").trim().length > 0 && t.status !== "completed").length;
    const staleInProgress = inScope.filter((t) => {
      if (t.status !== "in_progress" || !t.started_at) return false;
      const startedTs = Date.parse(t.started_at);
      if (Number.isNaN(startedTs)) return false;
      return nowTs - startedTs > 48 * 60 * 60 * 1000;
    }).length;

    return { atRisk, watch, normal, dueSoon, blocked, staleInProgress };
  }, [visibleTasks, nowTs]);

  const topUrgentTasks = useMemo(() => {
    return visibleTasks
      .filter((t) => t.status !== "completed")
      .sort((a, b) => {
        const riskRank = { at_risk: 0, blocked: 1, watch: 2, normal: 3 } as const;
        const ar = riskRank[(a.risk_state ?? "normal") as keyof typeof riskRank] ?? 2;
        const br = riskRank[(b.risk_state ?? "normal") as keyof typeof riskRank] ?? 2;
        if (ar !== br) return ar - br;

        const aBlocked = (a.blocked_reason ?? "").trim() ? 0 : 1;
        const bBlocked = (b.blocked_reason ?? "").trim() ? 0 : 1;
        if (aBlocked !== bBlocked) return aBlocked - bBlocked;

        const aEta = a.eta ? Date.parse(a.eta) : Number.POSITIVE_INFINITY;
        const bEta = b.eta ? Date.parse(b.eta) : Number.POSITIVE_INFINITY;
        return aEta - bEta;
      })
      .slice(0, 3);
  }, [visibleTasks]);

  const addTask = async () => {
    if (!title.trim()) return;
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title.trim(), project: project.trim(), objective, priority }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed to add task");
      return;
    }
    setTasks((prev) => [data.task, ...prev]);
    setError(null);
    logActivity(`Created task: ${data.task.title}`);
    setTitle("");
    setProject("");
  };

  const resetTaskDraft = () => {
    setTitle("");
    setProject("");
    setObjective("skyworks");
    setPriority("P2");
    setError(null);
  };

  const patchTask = async (taskId: string, payload: Record<string, unknown>) => {
    const res = await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Task update failed");
    return data.task as Task;
  };

  const moveTask = async (taskId: string, next: Status) => {
    const target = tasks.find((t) => t.id === taskId);
    if (!target) return;

    if (next === "in_progress" && target.status !== "in_progress" && inProgressCount >= 1) {
      setError("WIP limit reached: only 1 task can be In Progress at a time.");
      return;
    }

    const previous = tasks;
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: next } : t)));
    try {
      await patchTask(taskId, { status: next });
      logActivity(`Moved "${target.title}" to ${next.replace("_", " ")}`);
    } catch (e: unknown) {
      setTasks(previous);
      setError(e instanceof Error ? e.message : "Task update failed");
    }
  };

  const setPriorityForTask = async (taskId: string, p: Priority) => {
    const previous = tasks;
    const task = tasks.find((t) => t.id === taskId);
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, priority: p } : t)));
    try {
      await patchTask(taskId, { priority: p });
      if (task) logActivity(`Priority set to ${p}: ${task.title}`);
    } catch (e: unknown) {
      setTasks(previous);
      setError(e instanceof Error ? e.message : "Task update failed");
    }
  };

  const handleDropToColumn = async (taskId: string, next: Status) => {
    setDropColumn(null);
    setDraggingTaskId(null);
    await moveTask(taskId, next);
  };

  const setProjectDraft = (taskId: string, nextProject: string) => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, project: nextProject } : t)));
  };

  const setProjectForTask = async (taskId: string, nextProject: string) => {
    const normalized = nextProject.replace(/\s+/g, " ").trim();
    const previous = tasks;
    const task = tasks.find((t) => t.id === taskId);
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, project: normalized || null } : t)));
    try {
      await patchTask(taskId, { project: normalized });
      if (task) logActivity(`Project ${normalized ? `set to "${normalized}"` : "cleared"}: ${task.title}`);
    } catch (e: unknown) {
      setTasks(previous);
      setError(e instanceof Error ? e.message : "Task update failed");
    }
  };

  const setRiskForTask = async (taskId: string, risk: NonNullable<Task["risk_state"]>) => {
    const previous = tasks;
    const task = tasks.find((t) => t.id === taskId);
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, risk_state: risk } : t)));
    try {
      await patchTask(taskId, { risk_state: risk });
      if (task) logActivity(`Risk set to ${risk}: ${task.title}`);
    } catch (e: unknown) {
      setTasks(previous);
      setError(e instanceof Error ? e.message : "Task update failed");
    }
  };

  const setEtaForTask = async (taskId: string, eta: string) => {
    const previous = tasks;
    const task = tasks.find((t) => t.id === taskId);
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, eta: eta || null } : t)));
    try {
      await patchTask(taskId, { eta });
      if (task) logActivity(`ETA ${eta ? `set to ${eta}` : "cleared"}: ${task.title}`);
    } catch (e: unknown) {
      setTasks(previous);
      setError(e instanceof Error ? e.message : "Task update failed");
    }
  };

  const setBlockedReasonForTask = async (taskId: string, reason: string) => {
    const previous = tasks;
    const task = tasks.find((t) => t.id === taskId);
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, blocked_reason: reason || null } : t)));
    try {
      await patchTask(taskId, { blocked_reason: reason });
      if (task) logActivity(`Blocker ${reason ? "updated" : "cleared"}: ${task.title}`);
    } catch (e: unknown) {
      setTasks(previous);
      setError(e instanceof Error ? e.message : "Task update failed");
    }
  };

  const reorderBacklog = async (taskId: string, direction: "up" | "down") => {
    const backlog = grouped.backlog;
    const idx = backlog.findIndex((t) => t.id === taskId);
    if (idx < 0) return;
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= backlog.length) return;

    const a = backlog[idx];
    const b = backlog[swapIdx];
    const previous = tasks;

    setTasks((prev) => prev.map((t) => {
      if (t.id === a.id) return { ...t, sort_order: b.sort_order };
      if (t.id === b.id) return { ...t, sort_order: a.sort_order };
      return t;
    }));

    try {
      await Promise.all([
        patchTask(a.id, { sort_order: b.sort_order }),
        patchTask(b.id, { sort_order: a.sort_order }),
      ]);
      logActivity(`Reordered backlog: ${a.title} ${direction === "up" ? "up" : "down"}`);
      await loadTasks();
    } catch (e: unknown) {
      setTasks(previous);
      setError(e instanceof Error ? e.message : "Task update failed");
    }
  };

  const deleteTask = async (taskId: string) => {
    const previous = tasks;
    const task = tasks.find((t) => t.id === taskId);

    if (confirmDelete) {
      const ok = window.confirm(`Delete task "${task?.title ?? "this task"}"?`);
      if (!ok) return;
    }

    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    const res = await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
    if (!res.ok) {
      setTasks(previous);
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Failed to delete task");
      return;
    }

    if (task) logActivity(`Deleted task: ${task.title}`);
  };

  const exportVisibleTasks = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      filters: {
        project: projectFilter,
        objective: objectiveFilter,
        risk: riskFilter,
        time: timeFilter,
        search: searchQuery.trim(),
      },
      count: visibleTasks.length,
      tasks: visibleTasks,
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kanban-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);

    logActivity(`Exported ${visibleTasks.length} visible tasks (JSON)`);
  };

  const exportVisibleTasksCsv = () => {
    const header = [
      "id",
      "title",
      "project",
      "objective",
      "status",
      "priority",
      "risk_state",
      "eta",
      "blocked_reason",
      "updated_at",
    ];

    const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const rows = visibleTasks.map((t) => [
      t.id,
      t.title,
      t.project ?? "",
      t.objective,
      t.status,
      t.priority,
      t.risk_state ?? "normal",
      t.eta ?? "",
      t.blocked_reason ?? "",
      t.updated_at,
    ]);

    const csv = [header, ...rows].map((r) => r.map((c) => esc(String(c))).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kanban-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    logActivity(`Exported ${visibleTasks.length} visible tasks (CSV)`);
  };

  async function copyBoardSummary() {
    const statusCounts = {
      backlog: visibleTasks.filter((t) => t.status === "backlog").length,
      inProgress: visibleTasks.filter((t) => t.status === "in_progress").length,
      review: visibleTasks.filter((t) => t.status === "review").length,
      completed: visibleTasks.filter((t) => t.status === "completed").length,
    };


    const summary = [
      `Kanban Summary (${new Date().toLocaleString()})`,
      `Visible tasks: ${visibleTasks.length}/${tasks.length}`,
      `Filters: project=${projectFilter}, objective=${objectiveFilter}, risk=${riskFilter}, time=${timeFilter}, search=${searchQuery.trim() || "(none)"}`,
      `Columns: backlog=${statusCounts.backlog}, in_progress=${statusCounts.inProgress}, review=${statusCounts.review}, completed=${statusCounts.completed}`,
      `Risk: at_risk=${riskSummary.atRisk}, watch=${riskSummary.watch}, blocked=${riskSummary.blocked}, due_24h=${riskSummary.dueSoon}, stale_in_progress=${riskSummary.staleInProgress}`,
      `Top urgent:`,
      ...(topUrgentTasks.length
        ? topUrgentTasks.map((t) => {
            const blocked = (t.blocked_reason ?? "").trim() ? " [BLOCKED]" : "";
            const due = t.eta ? ` eta=${new Date(t.eta).toLocaleString()}` : "";
            return `- ${t.title} [${t.priority}] (${t.status})${blocked}${due}`;
          })
        : ["- none"]),
    ].join("\n");

    try {
      await navigator.clipboard.writeText(summary);
      logActivity("Copied board summary to clipboard");
    } catch {
      const blob = new Blob([summary], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `kanban-summary-${new Date().toISOString().slice(0, 10)}.txt`;
      a.click();
      URL.revokeObjectURL(url);

      setError("Clipboard blocked. Downloaded summary as TXT instead.");
      logActivity("Clipboard blocked; downloaded board summary TXT");
    }
  }

  const resetViewPreferences = () => {
    setProjectFilter("all");
    setObjectiveFilter("all");
    setRiskFilter("all");
    setTimeFilter("all");
    setSearchQuery("");
    setConfirmDelete(true);
    setShowRelativeTimes(true);
    setShowActivityPanel(true);
    setCompactCards(false);
    setShowBackgroundPanel(true);
    setShowTopUrgentPanel(true);
    setShowShortcutsHelp(false);
    setShowTipsPanel(false);
    setBgImageUrl("");
    setBgOverlay(55);

    window.localStorage.removeItem("kb_project_filter");
    window.localStorage.removeItem("kb_objective_filter");
    window.localStorage.removeItem("kb_risk_filter");
    window.localStorage.removeItem("kb_time_filter");
    window.localStorage.removeItem("kb_search_query");
    window.localStorage.removeItem("kb_confirm_delete");
    window.localStorage.removeItem("kb_show_relative_times");
    window.localStorage.removeItem("kb_show_activity_panel");
    window.localStorage.removeItem("kb_compact_cards");
    window.localStorage.removeItem("kb_show_background_panel");
    window.localStorage.removeItem("kb_show_top_urgent_panel");
    window.localStorage.removeItem("kb_show_shortcuts_help");
    window.localStorage.removeItem("kb_show_tips_panel");
    window.localStorage.removeItem("kb_bg_image_url");
    window.localStorage.removeItem("kb_bg_overlay");

    logActivity("Reset board view preferences");
  };

  const duplicateTask = async (taskId: string) => {
    const source = tasks.find((t) => t.id === taskId);
    if (!source) return;

    const payload = {
      title: `${source.title} (copy ${new Date().toLocaleTimeString()})`,
      project: source.project ?? "",
      objective: source.objective,
      priority: source.priority,
    };

    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || "Failed to duplicate task");
      return;
    }

    let createdTask = data.task as Task;

    // Copy execution metadata in a follow-up patch so duplicates preserve planning context.
    if (source.risk_state || source.eta || source.blocked_reason) {
      try {
        createdTask = await patchTask(createdTask.id, {
          risk_state: source.risk_state ?? "normal",
          eta: source.eta ?? "",
          blocked_reason: source.blocked_reason ?? "",
        });
      } catch {
        // non-fatal; keep duplicate even if metadata copy fails
      }
    }

    setTasks((prev) => [createdTask, ...prev]);
    logActivity(`Duplicated task: ${source.title}`);
  };

  const clearCompletedTasks = async () => {
    const completed = tasks.filter((t) => t.status === "completed");
    if (completed.length === 0) {
      setError("No completed tasks to clear.");
      return;
    }

    const ok = window.confirm(`Delete ${completed.length} completed task(s)?`);
    if (!ok) return;

    const previous = tasks;
    const completedIds = new Set(completed.map((t) => t.id));
    setTasks((prev) => prev.filter((t) => !completedIds.has(t.id)));

    const results = await Promise.all(
      completed.map(async (task) => {
        const res = await fetch(`/api/tasks/${task.id}`, { method: "DELETE" });
        return { id: task.id, ok: res.ok };
      })
    );

    const failed = results.filter((r) => !r.ok).length;
    if (failed > 0) {
      setTasks(previous);
      setError(`Failed to clear completed tasks (${failed} failed).`);
      return;
    }

    logActivity(`Cleared ${completed.length} completed task(s)`);
  };

  const shellStyle = bgImageUrl
    ? {
        backgroundImage: `linear-gradient(rgba(2,6,23,${bgOverlay / 100}), rgba(2,6,23,${bgOverlay / 100})), url(${bgImageUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }
    : undefined;

  return (
    <main style={shellStyle} className="min-h-screen bg-slate-950 text-white p-3 sm:p-4 md:p-6 space-y-4 md:space-y-5">
      <header className="sticky top-0 z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/95 p-3 backdrop-blur supports-[backdrop-filter]:bg-slate-950/80">
        <div>
          <h1 className="text-2xl font-bold">Eva’s Task Board</h1>
          <p className="text-slate-400">Owner-only Kanban · shared across devices · auto-refresh 30s</p>
          <p className="text-xs text-slate-500">Last sync: {updatedAt || "-"}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button className="min-h-11 rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium hover:bg-slate-800" onClick={loadTasks}>Refresh</button>
          <button className="min-h-11 rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium hover:bg-slate-800" onClick={exportVisibleTasks}>Export JSON</button>
          <button className="min-h-11 rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium hover:bg-slate-800" onClick={exportVisibleTasksCsv}>Export CSV</button>
          <button className="min-h-11 rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium hover:bg-slate-800" onClick={() => void copyBoardSummary()}>Copy Summary</button>
          <button className="min-h-11 rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium hover:bg-slate-800" onClick={() => setShowShortcutsHelp((v) => !v)}>Shortcuts</button>
          <button className="min-h-11 rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium hover:bg-slate-800" onClick={() => setShowTipsPanel((v) => !v)}>Tips</button>
          <button className="min-h-11 rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium hover:bg-slate-800" onClick={resetViewPreferences}>Reset View</button>
          <button className="min-h-11 rounded-lg border border-rose-700 px-4 py-2 text-sm font-medium text-rose-300 hover:bg-rose-950/40" onClick={() => void clearCompletedTasks()}>Clear Completed</button>
          <button className="min-h-11 rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium hover:bg-slate-800" onClick={async () => { await fetch("/api/logout", { method: "POST" }); window.location.href = "/login"; }}>Logout</button>
        </div>
      </header>

      {showShortcutsHelp ? (
        <section className="rounded-xl border border-slate-800 bg-slate-900 p-4">
          <h2 className="font-semibold mb-2">Keyboard Shortcuts</h2>
          <ul className="text-sm text-slate-300 space-y-1">
            <li><span className="font-mono">/</span> Focus search</li>
            <li><span className="font-mono">Esc</span> Clear search (when search focused)</li>
            <li><span className="font-mono">n</span> Focus new task title</li>
            <li><span className="font-mono">r</span> Refresh tasks</li>
            <li><span className="font-mono">t</span> Toggle tips panel</li>
            <li><span className="font-mono">x</span> Clear all filters/search</li>
            <li><span className="font-mono">?</span> Toggle this shortcuts panel</li>
          </ul>
        </section>
      ) : null}

      {showTipsPanel ? (
        <section className="rounded-xl border border-slate-800 bg-slate-900 p-4">
          <h2 className="font-semibold mb-2">Quick Tips</h2>
          <ul className="text-sm text-slate-300 space-y-1 list-disc pl-5">
            <li>Click risk/time summary chips to instantly filter down to problem tasks.</li>
            <li>Use Top Urgent “Start” to move the most important task into In Progress.</li>
            <li>Use Reset View if the board gets too filtered/customized.</li>
            <li>Use Export CSV for spreadsheet sharing and Copy Summary for chat updates.</li>
          </ul>
        </section>
      ) : null}

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
                void addTask();
              }
            }}
            placeholder="Task title"
            className="md:col-span-2 min-h-11 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
          />
          <input value={project} onChange={(e) => setProject(e.target.value)} placeholder="Project (optional)" className="min-h-11 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" />
          <select value={objective} onChange={(e) => setObjective(e.target.value as Objective)} className="min-h-11 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2">
            {OBJECTIVES.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
          </select>
          <select value={priority} onChange={(e) => setPriority(e.target.value as Priority)} className="min-h-11 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2">
            {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <button
            onClick={addTask}
            disabled={!title.trim()}
            className="min-h-11 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50 px-4 py-2 font-medium"
          >
            Create
          </button>
          <button
            onClick={resetTaskDraft}
            className="min-h-11 rounded-lg border border-slate-700 px-4 py-2 font-medium hover:bg-slate-800"
          >
            Reset Draft
          </button>
        </div>
        <FilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchInputRef={searchInputRef}
          projectFilter={projectFilter}
          onProjectFilterChange={setProjectFilter}
          projectOptions={projectOptions}
          objectiveFilter={objectiveFilter}
          onObjectiveFilterChange={setObjectiveFilter}
          riskFilter={riskFilter}
          onRiskFilterChange={setRiskFilter}
          timeFilter={timeFilter}
          onTimeFilterChange={setTimeFilter}
          confirmDelete={confirmDelete}
          onConfirmDeleteChange={setConfirmDelete}
          showRelativeTimes={showRelativeTimes}
          onShowRelativeTimesChange={setShowRelativeTimes}
          showActivityPanel={showActivityPanel}
          onShowActivityPanelChange={setShowActivityPanel}
          compactCards={compactCards}
          onCompactCardsChange={setCompactCards}
          showBackgroundPanel={showBackgroundPanel}
          onShowBackgroundPanelChange={setShowBackgroundPanel}
          showTopUrgentPanel={showTopUrgentPanel}
          onShowTopUrgentPanelChange={setShowTopUrgentPanel}
          showTipsPanel={showTipsPanel}
          onShowTipsPanelChange={setShowTipsPanel}
          visibleCount={visibleTasks.length}
          totalCount={tasks.length}
          riskSummary={riskSummary}
        />

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
                        onClick={() => void moveTask(t.id, "in_progress")}
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

      {showBackgroundPanel ? (
        <section className="rounded-xl border border-slate-800 bg-slate-900 p-4 space-y-3">
          <h2 className="font-semibold">Background Style</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-center">
            <input
              value={bgImageUrl}
              onChange={(e) => setBgImageUrl(e.target.value)}
              placeholder="Image URL (optional)"
              className="md:col-span-3 min-h-11 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
            />
            <div className="md:col-span-2 flex items-center gap-3">
              <label className="text-sm text-slate-400">Overlay {bgOverlay}%</label>
              <input
                type="range"
                min={0}
                max={90}
                value={bgOverlay}
                onChange={(e) => setBgOverlay(Number(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
          <p className="text-xs text-slate-500">Tip: set a hosted image URL. Leave blank to use the default dark background.</p>
        </section>
      ) : null}

      {showActivityPanel ? (
        <ActivityLog
          activity={activity}
          onClear={() => {
            setActivity([]);
            window.localStorage.removeItem("kb_activity_v1");
          }}
        />
      ) : null}

      {loading ? <p className="text-slate-400">Loading tasks...</p> : null}

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {COLUMNS.map((col) => (
          <KanbanColumn
            key={col.key}
            label={col.label}
            colKey={col.key}
            tasks={grouped[col.key]}
            backlogLength={grouped.backlog.length}
            isDropTarget={dropColumn === col.key}
            draggingTaskId={draggingTaskId}
            compactCards={compactCards}
            nowTs={nowTs}
            showRelativeTimes={showRelativeTimes}
            onDragOver={() => setDropColumn(col.key)}
            onDragLeave={() => setDropColumn((prev) => (prev === col.key ? null : prev))}
            onDrop={(taskId) => void handleDropToColumn(taskId, col.key)}
            onDragStart={(taskId) => setDraggingTaskId(taskId)}
            onDragEnd={() => { setDraggingTaskId(null); setDropColumn(null); }}
            onSetPriority={(taskId, p) => void setPriorityForTask(taskId, p)}
            onSetProjectDraft={(taskId, v) => setProjectDraft(taskId, v)}
            onSetProject={(taskId, v) => void setProjectForTask(taskId, v)}
            onSetRisk={(taskId, r) => void setRiskForTask(taskId, r)}
            onSetEta={(taskId, eta) => void setEtaForTask(taskId, eta)}
            onSetBlockedReason={(taskId, reason) => void setBlockedReasonForTask(taskId, reason)}
            onReorderUp={(taskId) => void reorderBacklog(taskId, "up")}
            onReorderDown={(taskId) => void reorderBacklog(taskId, "down")}
            onMoveBack={(taskId) => moveTask(taskId, col.key === "in_progress" ? "backlog" : col.key === "review" ? "in_progress" : "review")}
            onMoveNext={(taskId) => moveTask(taskId, col.key === "backlog" ? "in_progress" : col.key === "in_progress" ? "review" : "completed")}
            onDuplicate={(taskId) => void duplicateTask(taskId)}
            onDelete={(taskId) => deleteTask(taskId)}
          />
        ))}
      </section>
    </main>
  );
}
