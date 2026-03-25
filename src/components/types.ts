export type Objective = "skyworks" | "personal" | "side_hustles";
export type Status = "backlog" | "in_progress" | "review" | "blocked" | "completed";
export type Priority = "P0" | "P1" | "P2" | "P3";

export type Task = {
  id: string;
  title: string;
  project?: string | null;
  objective: Objective;
  status: Status;
  priority: Priority;
  sort_order: number;
  owner?: string;
  started_at?: string | null;
  eta?: string | null;
  blocked_reason?: string | null;
  risk_state?: "normal" | "watch" | "at_risk" | "blocked";
  created_at: string;
  updated_at: string;
};


export const OBJECTIVES: { key: Objective; label: string }[] = [
  { key: "skyworks", label: "Skyworks" },
  { key: "personal", label: "Personal" },
  { key: "side_hustles", label: "Side Hustles" },
];

export const PRIORITIES: Priority[] = ["P0", "P1", "P2", "P3"];
export const RISK_STATES: Array<NonNullable<Task["risk_state"]>> = ["normal", "watch", "at_risk", "blocked"];

export const COLUMNS: { key: Status; label: string }[] = [
  { key: "backlog", label: "Backlog" },
  { key: "in_progress", label: "In Progress" },
  { key: "review", label: "Review" },
  { key: "blocked", label: "Blocked" },
  { key: "completed", label: "Completed" },
];
