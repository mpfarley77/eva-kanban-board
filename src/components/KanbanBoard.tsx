"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  type Objective,
  type Status,
  type Priority,
  type Task,
  OBJECTIVES,
  PRIORITIES,
  COLUMNS,
} from "./types";
import FilterBar from "./FilterBar";
import KanbanColumn, { HEADER_COLORS } from "./KanbanColumn";
import TopBar from "./TopBar";
import Toast from "./Toast";

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
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const titleInputRef = useRef<HTMLInputElement | null>(null);
  const searchQueryRef = useRef("");
  const [bgImageUrl, setBgImageUrl] = useState("");
  const [bgOverlay, setBgOverlay] = useState(55);
  const [bgUploading, setBgUploading] = useState(false);
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const [dropColumn, setDropColumn] = useState<Status | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(true);
  const [showRelativeTimes, setShowRelativeTimes] = useState(true);
  const [compactCards, setCompactCards] = useState(false);
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
  const [showBackgroundPanel, setShowBackgroundPanel] = useState(true);
  const [localProjects, setLocalProjects] = useState<string[]>([]);
  const [showAddTaskNewProject, setShowAddTaskNewProject] = useState(false);
  const [newProjectDraft, setNewProjectDraft] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  // Keyed by taskId — stores the status a task had before being auto-moved to Blocked.
  // Kept in local state only; not persisted to DB since the column doesn't exist yet.
  const [preBlockStatuses, setPreBlockStatuses] = useState<Record<string, Status>>({});
  const [toast, setToast] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stickyBlockRef = useRef<HTMLDivElement>(null);
  const headersScrollRef = useRef<HTMLDivElement>(null);
  const bodiesScrollRef = useRef<HTMLDivElement>(null);
  const [stickyBlockHeight, setStickyBlockHeight] = useState(200);

  useEffect(() => {
    const el = stickyBlockRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setStickyBlockHeight(el.offsetHeight));
    ro.observe(el);
    setStickyBlockHeight(el.offsetHeight);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const headers = headersScrollRef.current;
    const bodies = bodiesScrollRef.current;
    if (!headers || !bodies) return;
    const onBodiesScroll = () => { headers.scrollLeft = bodies.scrollLeft; };
    bodies.addEventListener("scroll", onBodiesScroll);
    return () => bodies.removeEventListener("scroll", onBodiesScroll);
  }, []);

  const showToast = (message: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast(message);
    toastTimerRef.current = setTimeout(() => setToast(null), 3000);
  };

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
    const savedOverlay = Number(window.localStorage.getItem("kb_bg_overlay") ?? "55");
    setBgOverlay(Number.isFinite(savedOverlay) ? Math.min(90, Math.max(0, savedOverlay)) : 55);

    // Fetch the authoritative background URL from storage so it works across devices.
    fetch("/api/background")
      .then((r) => r.json())
      .then((data: { url: string | null }) => {
        const url = data.url ?? "";
        if (url && url.startsWith("http")) {
          setBgImageUrl(url);
          window.localStorage.setItem("kb_bg_image_url", url);
        } else {
          setBgImageUrl("");
          window.localStorage.removeItem("kb_bg_image_url");
        }
      })
      .catch(() => {
        // Fall back to localStorage if the API is unreachable.
        const savedUrl = window.localStorage.getItem("kb_bg_image_url") ?? "";
        if (savedUrl && savedUrl.startsWith("http")) {
          setBgImageUrl(savedUrl);
        } else {
          setBgImageUrl("");
          window.localStorage.removeItem("kb_bg_image_url");
        }
      });
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
    const savedCompactCards = window.localStorage.getItem("kb_compact_cards") ?? "0";
    const savedShowBackgroundPanel = window.localStorage.getItem("kb_show_background_panel") ?? "1";
    const savedShowShortcutsHelp = window.localStorage.getItem("kb_show_shortcuts_help") ?? "0";
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
    setCompactCards(savedCompactCards === "1");
    setShowBackgroundPanel(savedShowBackgroundPanel !== "0");
    setShowShortcutsHelp(savedShowShortcutsHelp === "1");
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
    window.localStorage.setItem("kb_compact_cards", compactCards ? "1" : "0");
  }, [compactCards]);

  useEffect(() => {
    window.localStorage.setItem("kb_show_background_panel", showBackgroundPanel ? "1" : "0");
  }, [showBackgroundPanel]);

  useEffect(() => {
    window.localStorage.setItem("kb_show_shortcuts_help", showShortcutsHelp ? "1" : "0");
  }, [showShortcutsHelp]);

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
        setShowShortcutsHelp((prev) => !prev);
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

  // Used by FilterBar for filtering (all tasks)
  const projectOptions = useMemo(() => {
    const names = Array.from(new Set(tasks.map((t) => (t.project ?? "").trim()).filter(Boolean)));
    return names.sort((a, b) => a.localeCompare(b));
  }, [tasks]);

  // Used by Add Task form and TaskCard dropdowns (open tasks only + user-typed projects)
  const allProjectOptions = useMemo(() => {
    const fromOpenTasks = tasks
      .filter((t) => t.status !== "completed")
      .map((t) => (t.project ?? "").trim())
      .filter(Boolean);
    const combined = new Set([...fromOpenTasks, ...localProjects]);
    // Also include the current draft project so it stays selected after typing
    if (project.trim()) combined.add(project.trim());
    return Array.from(combined).sort((a, b) => a.localeCompare(b));
  }, [tasks, localProjects, project]);

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
      // Use sort_order for all columns when available (set by drag-reorder).
      // Tasks without sort_order fall back to newest-updated-first.
      if (a.sort_order != null && b.sort_order != null) return a.sort_order - b.sort_order;
      if (a.sort_order != null) return -1;
      if (b.sort_order != null) return 1;
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });

    return COLUMNS.reduce<Record<Status, Task[]>>(
      (acc, col) => ({ ...acc, [col.key]: sorted.filter((t) => t.status === col.key) }),
      { backlog: [], in_progress: [], review: [], blocked: [], completed: [] }
    );
  }, [visibleTasks]);

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
    const blocked = inScope.filter((t) => t.status === "blocked").length;
    const staleInProgress = inScope.filter((t) => {
      if (t.status !== "in_progress" || !t.started_at) return false;
      const startedTs = Date.parse(t.started_at);
      if (Number.isNaN(startedTs)) return false;
      return nowTs - startedTs > 48 * 60 * 60 * 1000;
    }).length;

    return { atRisk, watch, normal, dueSoon, blocked, staleInProgress };
  }, [visibleTasks, nowTs]);

  const handleNewProject = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setLocalProjects((prev) => {
      if (prev.includes(trimmed)) return prev;
      return [...prev, trimmed].sort((a, b) => a.localeCompare(b));
    });
  };

  const saveAddTaskNewProject = () => {
    const name = newProjectDraft.trim();
    if (name) {
      handleNewProject(name);
      setProject(name);
    }
    setShowAddTaskNewProject(false);
    setNewProjectDraft("");
  };

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
    if (data.warning) {
      setError(`Task created, but project was not saved: ${data.warning}`);
    } else {
      setError(null);
    }
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

  const moveTask = async (taskId: string, next: Status): Promise<boolean> => {
    const target = tasks.find((t) => t.id === taskId);
    if (!target) return false;

    const previous = tasks;
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: next } : t)));
    try {
      await patchTask(taskId, { status: next });
      return true;
    } catch (e: unknown) {
      console.error("[moveTask] patchTask FAILED", e);
      setTasks(previous);
      setError(e instanceof Error ? e.message : "Task update failed");
      return false;
    }
  };

  const setPriorityForTask = async (taskId: string, p: Priority) => {
    const previous = tasks;
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, priority: p } : t)));
    try {
      await patchTask(taskId, { priority: p });
    } catch (e: unknown) {
      setTasks(previous);
      setError(e instanceof Error ? e.message : "Task update failed");
    }
  };

  const handleDropToColumn = async (taskId: string, next: Status) => {
    setDropColumn(null);
    setDraggingTaskId(null);
    const target = tasks.find((t) => t.id === taskId);
    const moved = await moveTask(taskId, next);
    if (moved && target) {
      const colLabel = next.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
      showToast(`"${target.title}" moved to ${colLabel}`);
    }
  };

  const setProjectDraft = (taskId: string, nextProject: string) => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, project: nextProject } : t)));
  };

  const setProjectForTask = async (taskId: string, nextProject: string) => {
    const normalized = nextProject.replace(/\s+/g, " ").trim();
    const previous = tasks;
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, project: normalized || null } : t)));
    try {
      await patchTask(taskId, { project: normalized });
    } catch (e: unknown) {
      setTasks(previous);
      setError(e instanceof Error ? e.message : "Task update failed");
    }
  };

  const setRiskForTask = async (taskId: string, risk: NonNullable<Task["risk_state"]>) => {
    const previous = tasks;
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const patch: Record<string, unknown> = { risk_state: risk };
    let nextStatus: Status | undefined;

    if (risk === "blocked" && task.status !== "blocked") {
      // Only save pre-block status if blocked_reason hasn't already saved it.
      if (!preBlockStatuses[taskId]) {
        setPreBlockStatuses((prev) => ({ ...prev, [taskId]: task.status }));
      }
      nextStatus = "blocked";
      patch.status = "blocked";
    } else if (risk !== "blocked" && task.status === "blocked") {
      // Only restore if the blocked_reason isn't also holding the task in Blocked.
      if (!(task.blocked_reason ?? "").trim()) {
        const restored = preBlockStatuses[taskId] ?? "backlog";
        setPreBlockStatuses((prev) => { const next = { ...prev }; delete next[taskId]; return next; });
        nextStatus = restored;
        patch.status = restored;
      }
    }

    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, risk_state: risk, ...(nextStatus !== undefined ? { status: nextStatus } : {}) }
          : t
      )
    );
    try {
      await patchTask(taskId, patch);
    } catch (e: unknown) {
      setTasks(previous);
      setError(e instanceof Error ? e.message : "Task update failed");
    }
  };

  const setEtaForTask = async (taskId: string, eta: string) => {
    const previous = tasks;
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, eta: eta || null } : t)));
    try {
      await patchTask(taskId, { eta });
    } catch (e: unknown) {
      setTasks(previous);
      setError(e instanceof Error ? e.message : "Task update failed");
    }
  };

  const setBlockedReasonForTask = async (taskId: string, reason: string) => {
    const previous = tasks;
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const patch: Record<string, unknown> = { blocked_reason: reason };
    let nextStatus: Status | undefined;

    if (reason && task.status !== "blocked") {
      // Moving to Blocked — save previous status locally so we can restore it later.
      setPreBlockStatuses((prev) => ({ ...prev, [taskId]: task.status }));
      nextStatus = "blocked";
      patch.status = "blocked";
    } else if (!reason && task.status === "blocked") {
      // Clearing blocker — restore to the saved previous status (or backlog as fallback).
      const restored = preBlockStatuses[taskId] ?? "backlog";
      setPreBlockStatuses((prev) => { const next = { ...prev }; delete next[taskId]; return next; });
      nextStatus = restored;
      patch.status = restored;
    }

    setTasks((prev) => prev.map((t) => {
      if (t.id !== taskId) return t;
      return {
        ...t,
        blocked_reason: reason || null,
        ...(nextStatus !== undefined ? { status: nextStatus } : {}),
      };
    }));

    try {
      await patchTask(taskId, patch);
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
      showToast(`Moved "${a.title}" ${direction === "up" ? "up ↑" : "down ↓"} in backlog`);
      await loadTasks();
    } catch (e: unknown) {
      setTasks(previous);
      setError(e instanceof Error ? e.message : "Task update failed");
    }
  };

  const dropAtIndex = async (taskId: string, colKey: Status, toIndex: number) => {
    setDraggingTaskId(null);
    setDropColumn(null);
    const target = tasks.find((t) => t.id === taskId);
    if (!target) return;

    // Build the target column's current task list (task not yet in it) and
    // insert the incoming task at the requested position.
    const colTasks = [...grouped[colKey]];
    const clampedIdx = Math.min(Math.max(toIndex, 0), colTasks.length);
    colTasks.splice(clampedIdx, 0, { ...target, status: colKey });

    // Assign consecutive sort_orders to every task in the column.
    const updates = colTasks.map((t, i) => ({ id: t.id, sort_order: (i + 1) * 1000 }));

    console.log("AFTER INSERT - tasks in target column:", colTasks.map((t, i) => i + ": " + t.title));
    console.log("SORT ORDERS:", updates.map((u, i) => colTasks[i].title + " = " + u.sort_order));

    const previous = tasks;
    setTasks((prev) =>
      prev.map((t) => {
        const u = updates.find((u) => u.id === t.id);
        if (t.id === taskId) return { ...t, status: colKey, sort_order: u!.sort_order };
        return u ? { ...t, sort_order: u.sort_order } : t;
      })
    );

    try {
      // Patch status + sort_order for the moved task, sort_order only for others.
      const movedOrder = updates.find((u) => u.id === taskId)!.sort_order;
      await patchTask(taskId, { status: colKey, sort_order: movedOrder });
      await Promise.all(
        updates
          .filter((u) => u.id !== taskId)
          .map((u) => patchTask(u.id, { sort_order: u.sort_order }))
      );
      const colLabel = colKey.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
      showToast(`"${target.title}" moved to ${colLabel}`);
    } catch (e: unknown) {
      setTasks(previous);
      setError(e instanceof Error ? e.message : "Move failed");
    }
  };

  const reorderInColumn = async (taskId: string, colKey: Status, toIndex: number) => {
    const colTasks = [...grouped[colKey]];
    const fromIdx = colTasks.findIndex((t) => t.id === taskId);
    if (fromIdx < 0) return;
    // Remove the dragged task then insert at the adjusted position.
    const [moved] = colTasks.splice(fromIdx, 1);
    const insertAt = toIndex > fromIdx ? toIndex - 1 : toIndex;
    colTasks.splice(insertAt, 0, moved);

    // Assign consecutive sort_orders (spaced by 1000) to every task in the column.
    const updates = colTasks.map((t, i) => ({ id: t.id, sort_order: (i + 1) * 1000 }));

    const previous = tasks;
    setTasks((prev) =>
      prev.map((t) => {
        const u = updates.find((u) => u.id === t.id);
        return u ? { ...t, sort_order: u.sort_order } : t;
      })
    );
    try {
      await Promise.all(updates.map((u) => patchTask(u.id, { sort_order: u.sort_order })));
    } catch (e: unknown) {
      setTasks(previous);
      setError(e instanceof Error ? e.message : "Reorder failed");
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
  };

  async function copyBoardSummary() {
    const statusCounts = {
      backlog: visibleTasks.filter((t) => t.status === "backlog").length,
      inProgress: visibleTasks.filter((t) => t.status === "in_progress").length,
      review: visibleTasks.filter((t) => t.status === "review").length,
      blocked: visibleTasks.filter((t) => t.status === "blocked").length,
      completed: visibleTasks.filter((t) => t.status === "completed").length,
    };


    const summary = [
      `Kanban Summary (${new Date().toLocaleString()})`,
      `Visible tasks: ${visibleTasks.length}/${tasks.length}`,
      `Filters: project=${projectFilter}, objective=${objectiveFilter}, risk=${riskFilter}, time=${timeFilter}, search=${searchQuery.trim() || "(none)"}`,
      `Columns: backlog=${statusCounts.backlog}, in_progress=${statusCounts.inProgress}, review=${statusCounts.review}, blocked=${statusCounts.blocked}, completed=${statusCounts.completed}`,
      `Risk: at_risk=${riskSummary.atRisk}, watch=${riskSummary.watch}, blocked=${riskSummary.blocked}, due_24h=${riskSummary.dueSoon}, stale_in_progress=${riskSummary.staleInProgress}`,
    ].join("\n");

    try {
      await navigator.clipboard.writeText(summary);
    } catch {
      const blob = new Blob([summary], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `kanban-summary-${new Date().toISOString().slice(0, 10)}.txt`;
      a.click();
      URL.revokeObjectURL(url);

      setError("Clipboard blocked. Downloaded summary as TXT instead.");
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
    setCompactCards(false);
    setShowBackgroundPanel(true);
    setShowShortcutsHelp(false);
    setBgImageUrl("");
    setBgOverlay(55);

    window.localStorage.removeItem("kb_project_filter");
    window.localStorage.removeItem("kb_objective_filter");
    window.localStorage.removeItem("kb_risk_filter");
    window.localStorage.removeItem("kb_time_filter");
    window.localStorage.removeItem("kb_search_query");
    window.localStorage.removeItem("kb_confirm_delete");
    window.localStorage.removeItem("kb_show_relative_times");
    window.localStorage.removeItem("kb_compact_cards");
    window.localStorage.removeItem("kb_show_background_panel");
    window.localStorage.removeItem("kb_show_shortcuts_help");
    window.localStorage.removeItem("kb_bg_image_url");
    window.localStorage.removeItem("kb_bg_overlay");
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

  };

  // ─── Shared light-theme style tokens ────────────────────────────────────────
  const panelStyle: React.CSSProperties = {
    background: "rgba(255,255,255,0.92)",
    backdropFilter: "blur(8px)",
    borderRadius: 12,
    border: "1px solid rgba(9,30,66,0.13)",
    padding: 16,
  };
  const panelHeading: React.CSSProperties = {
    fontSize: 14, fontWeight: 700, color: "#172B4D", margin: "0 0 10px",
  };
  const fieldStyle: React.CSSProperties = {
    background: "#FAFBFC",
    border: "1px solid #DFE1E6",
    borderRadius: 6,
    color: "#172B4D",
    fontSize: 13,
    padding: "8px 12px",
    minHeight: 38,
  };

  const SHORTCUTS: { key: string; desc: string }[] = [
    { key: "/",   desc: "Focus search" },
    { key: "Esc", desc: "Clear search (when search focused)" },
    { key: "n",   desc: "Focus new task title" },
    { key: "r",   desc: "Refresh tasks" },
    { key: "t",   desc: "Toggle tips panel" },
    { key: "x",   desc: "Clear all filters/search" },
    { key: "?",   desc: "Toggle this shortcuts panel" },
  ];

  const shellStyle = {
    backgroundImage: bgImageUrl
      ? `linear-gradient(rgba(2,6,23,${bgOverlay / 100}), rgba(2,6,23,${bgOverlay / 100})), url(${bgImageUrl})`
      : "linear-gradient(135deg, #0062E6 0%, #33A1FD 30%, #59C3C3 60%, #7BCB72 100%)",
    backgroundSize: "cover",
    backgroundPosition: "center",
    // Use "scroll" for custom images so GIFs animate correctly — "fixed" forces browsers
    // to rasterize the background at paint time, which freezes animated GIFs.
    backgroundAttachment: bgImageUrl ? "scroll" : "fixed",
  };

  return (
    <main style={shellStyle} className="min-h-screen text-white">
      <TopBar
        updatedAt={updatedAt}
        onRefresh={loadTasks}
        onExportJson={exportVisibleTasks}
        onExportCsv={exportVisibleTasksCsv}
        onCopySummary={() => void copyBoardSummary()}
        onToggleShortcuts={() => setShowShortcutsHelp((v) => !v)}
        onToggleTips={() => setShowShortcutsHelp((v) => !v)}
        onResetView={resetViewPreferences}
        onClearCompleted={() => void clearCompletedTasks()}
        onLogout={async () => { await fetch("/api/logout", { method: "POST" }); window.location.href = "/login"; }}
      />
      <div className="p-3 sm:p-4 md:p-6 space-y-4 md:space-y-5">

      {showSettings && showShortcutsHelp ? (
        <section style={panelStyle}>
          <h2 style={panelHeading}>Keyboard Shortcuts</h2>
          <ul style={{ fontSize: 13, color: "#172B4D", display: "flex", flexDirection: "column", gap: 4, listStyle: "none", margin: 0, padding: 0 }}>
            {SHORTCUTS.map(({ key, desc }) => (
              <li key={key} style={{ display: "flex", gap: 10, alignItems: "baseline" }}>
                <kbd style={{ background: "#F4F5F7", border: "1px solid #DFE1E6", borderRadius: 3, padding: "1px 6px", fontFamily: "monospace", fontSize: 12, color: "#172B4D" }}>{key}</kbd>
                <span style={{ color: "#5E6C84" }}>{desc}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div>
        <div
          ref={stickyBlockRef}
          style={{
            position: "sticky",
            top: 64,
            zIndex: 40,
            display: "flex",
            flexDirection: "column",
            gap: 16,
            // When a custom image is active the main background uses "scroll", so we can't
            // mirror it with background-attachment:fixed. Use a frosted-glass backdrop instead.
            ...(bgImageUrl
              ? { backdropFilter: "blur(0px)", background: "transparent" }
              : {
                  backgroundImage: shellStyle.backgroundImage,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  backgroundAttachment: "fixed",
                }),
          }}
        >
          <section style={{ ...panelStyle, display: "flex", flexDirection: "column", gap: 12 }}>
        <h2 style={panelHeading}>Add Task</h2>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <input
            ref={titleInputRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void addTask(); } }}
            placeholder="Task title"
            style={{ ...fieldStyle, flex: "2 1 180px" }}
          />
          {showAddTaskNewProject ? (
            <>
              <input
                autoFocus
                value={newProjectDraft}
                onChange={(e) => setNewProjectDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") { e.preventDefault(); saveAddTaskNewProject(); }
                  if (e.key === "Escape") { setShowAddTaskNewProject(false); setNewProjectDraft(""); }
                }}
                placeholder="New project name"
                style={{ ...fieldStyle, flex: "1 1 130px" }}
              />
              <button onClick={saveAddTaskNewProject} style={{ ...fieldStyle, flex: "0 0 auto", cursor: "pointer" }}>Save</button>
              <button onClick={() => { setShowAddTaskNewProject(false); setNewProjectDraft(""); }} style={{ ...fieldStyle, flex: "0 0 auto", cursor: "pointer" }}>✕</button>
            </>
          ) : (
            <select
              value={project}
              onChange={(e) => {
                const v = e.target.value;
                if (v === "__create__") { setShowAddTaskNewProject(true); setNewProjectDraft(""); setProject(""); return; }
                setProject(v);
              }}
              style={{ ...fieldStyle, flex: "1 1 130px" }}
            >
              <option value="">— no project —</option>
              {allProjectOptions.map((p) => <option key={p} value={p}>{p}</option>)}
              <option value="__create__">+ Create New Project</option>
            </select>
          )}
          <select value={objective} onChange={(e) => setObjective(e.target.value as Objective)} style={{ ...fieldStyle, flex: "1 1 130px" }}>
            {OBJECTIVES.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
          </select>
          <select value={priority} onChange={(e) => setPriority(e.target.value as Priority)} style={{ ...fieldStyle, flex: "0 1 80px" }}>
            {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <button
            onClick={addTask}
            disabled={!title.trim()}
            style={{ ...fieldStyle, flex: "0 0 auto", background: "#0079BF", color: "#fff", border: "none", fontWeight: 600, cursor: title.trim() ? "pointer" : "not-allowed", opacity: title.trim() ? 1 : 0.5 }}
          >
            Create
          </button>
          <button onClick={resetTaskDraft} style={{ ...fieldStyle, flex: "0 0 auto", cursor: "pointer" }}>
            Reset Draft
          </button>
        </div>

        {/* ── Accordion toggle ── */}
        <button
          onClick={() => setShowSettings((v) => !v)}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            background: "#F4F5F7",
            border: "1px solid #DFE1E6",
            borderRadius: 6,
            padding: "7px 12px",
            fontSize: 12,
            fontWeight: 600,
            color: "#5E6C84",
            cursor: "pointer",
          }}
        >
          <span>Filters &amp; Settings</span>
          <span style={{
            display: "inline-block",
            transform: showSettings ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s ease",
            fontSize: 10,
            lineHeight: 1,
          }}>▼</span>
        </button>

        {showSettings && <>
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
          compactCards={compactCards}
          onCompactCardsChange={setCompactCards}
          showBackgroundPanel={showBackgroundPanel}
          onShowBackgroundPanelChange={setShowBackgroundPanel}
          visibleCount={visibleTasks.length}
          totalCount={tasks.length}
          riskSummary={riskSummary}
        />

        {error ? <p style={{ fontSize: 13, color: "#BF2600", margin: 0 }}>{error}</p> : null}
        </>}
          </section>
          {/* Sticky column headers row */}
          <div ref={headersScrollRef} style={{ display: "flex", gap: 14, overflowX: "hidden" }}>
            {COLUMNS.map((col) => (
              <div
                key={col.key}
                className="kb-col"
                style={{
                  background: HEADER_COLORS[col.key],
                  borderRadius: "12px 12px 0 0",
                  padding: "10px 12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 8,
                }}
              >
                <span style={{ fontSize: 14, fontWeight: 700, color: "#fff", textTransform: "uppercase", letterSpacing: "0.5px" }}>{col.label}</span>
                <span style={{ width: 22, height: 22, borderRadius: "50%", background: "rgba(255,255,255,0.3)", color: "#fff", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{grouped[col.key].length}</span>
              </div>
            ))}
          </div>
        </div>

        <div ref={bodiesScrollRef} className="kb-bodies-row" style={{ display: "flex", gap: 14 }}>
        {COLUMNS.map((col) => (
          <KanbanColumn
            key={col.key}
            noHeader
            bodyMinHeight={`calc(100vh - 64px - ${stickyBlockHeight}px)`}
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
            projectOptions={allProjectOptions}
            onNewProject={handleNewProject}
            onSetPriority={(taskId, p) => void setPriorityForTask(taskId, p)}
            onSetProjectDraft={(taskId, v) => setProjectDraft(taskId, v)}
            onSetProject={(taskId, v) => void setProjectForTask(taskId, v)}
            onSetRisk={(taskId, r) => void setRiskForTask(taskId, r)}
            onSetEta={(taskId, eta) => void setEtaForTask(taskId, eta)}
            onSetBlockedReason={(taskId, reason) => void setBlockedReasonForTask(taskId, reason)}
            onReorderUp={(taskId) => void reorderBacklog(taskId, "up")}
            onReorderDown={(taskId) => void reorderBacklog(taskId, "down")}
            onReorderInColumn={(taskId, toIndex) => void reorderInColumn(taskId, col.key, toIndex)}
            onDropAtIndex={(taskId, toIndex) => void dropAtIndex(taskId, col.key, toIndex)}
            onDelete={(taskId) => deleteTask(taskId)}
          />
        ))}
        </div>
      </div>

      {showSettings && showBackgroundPanel ? (
        <section style={{ ...panelStyle, display: "flex", flexDirection: "column", gap: 12 }}>
          <h2 style={panelHeading}>Background Style</h2>

          {/* Upload row */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
            <label
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                background: "#0079BF",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                padding: "7px 14px",
                fontSize: 13,
                fontWeight: 600,
                cursor: bgUploading ? "not-allowed" : "pointer",
                opacity: bgUploading ? 0.6 : 1,
                transition: "opacity 0.15s",
              }}
            >
              {bgUploading ? "Uploading…" : "Choose Image"}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                style={{ display: "none" }}
                disabled={bgUploading}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  e.target.value = "";
                  if (file.size > 10 * 1024 * 1024) {
                    setError("Image must be 10 MB or smaller.");
                    return;
                  }
                  setBgUploading(true);
                  try {
                    let finalUrl: string;
                    if (file.size > 4 * 1024 * 1024) {
                      // Large file: go directly to Supabase via presigned URL to bypass Vercel's 4.5 MB limit.
                      const presignRes = await fetch("/api/background/presign", { method: "POST" });
                      const presignData = await presignRes.json() as { signedUrl?: string; publicUrl?: string; error?: string };
                      if (!presignRes.ok || !presignData.signedUrl) throw new Error(presignData.error ?? "Failed to get upload URL");
                      const putRes = await fetch(presignData.signedUrl, {
                        method: "PUT",
                        headers: { "Content-Type": file.type || "application/octet-stream" },
                        body: file,
                      });
                      if (!putRes.ok) throw new Error(`Direct upload failed (${putRes.status})`);
                      finalUrl = presignData.publicUrl!;
                    } else {
                      // Small file: upload through the Next.js API route.
                      const form = new FormData();
                      form.append("file", file);
                      const res = await fetch("/api/background", { method: "POST", body: form });
                      const data = await res.json() as { url?: string; error?: string };
                      if (!res.ok || !data.url) throw new Error(data.error ?? "Upload failed");
                      finalUrl = data.url;
                    }
                    setBgImageUrl(finalUrl);
                    window.localStorage.setItem("kb_bg_image_url", finalUrl);
                  } catch (err) {
                    setError(err instanceof Error ? err.message : "Upload failed");
                  } finally {
                    setBgUploading(false);
                  }
                }}
              />
            </label>

            {bgImageUrl && (
              <button
                onClick={async () => {
                  try {
                    await fetch("/api/background", { method: "DELETE" });
                  } catch { /* best-effort */ }
                  setBgImageUrl("");
                  window.localStorage.removeItem("kb_bg_image_url");
                }}
                style={{
                  background: "rgba(235,90,70,0.12)",
                  border: "1px solid #FFBDAD",
                  borderRadius: 6,
                  color: "#BF2600",
                  fontSize: 13,
                  fontWeight: 600,
                  padding: "7px 14px",
                  cursor: "pointer",
                }}
              >
                Remove Background
              </button>
            )}

            {bgImageUrl && (
              <span style={{ fontSize: 12, color: "#5E6C84", fontStyle: "italic", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 200 }}>
                ✓ Image uploaded
              </span>
            )}
          </div>

          {/* Overlay slider — only shown when an image is active */}
          {bgImageUrl && (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <label style={{ fontSize: 13, color: "#5E6C84", whiteSpace: "nowrap" }}>Overlay {bgOverlay}%</label>
              <input type="range" min={0} max={90} value={bgOverlay} onChange={(e) => setBgOverlay(Number(e.target.value))} style={{ flex: 1 }} />
            </div>
          )}

          <p style={{ fontSize: 12, color: "#7A869A", margin: 0 }}>
            Upload a JPG, PNG, WebP, or GIF. GIFs must be under 4.5MB to loop. Leave empty to use the default gradient.
          </p>
        </section>
      ) : null}

      {loading ? <p style={{ fontSize: 13, color: "#5E6C84" }}>Loading tasks…</p> : null}

      </div>
      {toast && <Toast message={toast} />}
    </main>
  );
}
