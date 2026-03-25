import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

const OWNER = "Eva";

type Task = {
  id: string;
  status: "backlog" | "in_progress" | "review" | "blocked" | "completed";
  priority: "P0" | "P1" | "P2" | "P3";
  updated_at: string;
};

const P: Record<Task["priority"], number> = { P0: 0, P1: 1, P2: 2, P3: 3 };

export async function GET(req: NextRequest) {
  const supabase = getSupabase();
  const token = req.nextUrl.searchParams.get("token");
  if (!process.env.KB_AUTOMATION_TOKEN) {
    return NextResponse.json({ error: "KB_AUTOMATION_TOKEN not configured" }, { status: 500 });
  }
  if (!token || token !== process.env.KB_AUTOMATION_TOKEN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("tasks")
    .select("id,status,priority,updated_at")
    .eq("owner", OWNER)
    .order("updated_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const tasks = (data || []) as Task[];
  const candidates = tasks.filter((t) => t.status !== "completed");

  if (candidates.length === 0) {
    return NextResponse.json({ ok: true, message: "No non-completed tasks to rebucket" });
  }

  const statusRank: Record<Task["status"], number> = {
    in_progress: 0,
    review: 1,
    backlog: 2,
    blocked: 3,
    completed: 4,
  };

  const active = [...candidates].sort((a, b) => {
    const p = P[a.priority] - P[b.priority];
    if (p !== 0) return p;

    const s = statusRank[a.status] - statusRank[b.status];
    if (s !== 0) return s;

    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
  })[0];

  const updates = await Promise.all(
    tasks.map((t) => {
      const next = t.status === "completed" ? "completed" : t.id === active.id ? "in_progress" : "backlog";
      if (next === t.status) return Promise.resolve({ id: t.id, changed: false });
      return supabase
        .from("tasks")
        .update({ status: next, last_update_at: new Date().toISOString() })
        .eq("id", t.id)
        .eq("owner", OWNER)
        .then(({ error }) => ({ id: t.id, changed: !error, error: error?.message }));
    })
  );

  return NextResponse.json({
    ok: true,
    activeTaskId: active.id,
    changed: updates.filter((u) => u.changed).length,
    updates,
  });
}
