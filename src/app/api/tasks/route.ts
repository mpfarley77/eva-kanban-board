import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

type TaskOut = { status:string; priority:string; sort_order:number|null; updated_at:string };
const OWNER = "Eva";

// Detects when any optional column (project, pre_block_status) is missing from the schema.
const OPTIONAL_COLS = ["project", "pre_block_status"];
function isOptionalColMissing(msg: string) {
  const m = msg.toLowerCase();
  return (m.includes("does not exist") || m.includes("schema cache")) &&
    OPTIONAL_COLS.some((col) => m.includes(col));
}

function sortTasks(tasks: TaskOut[]) {
  return [...tasks].sort((a, b) => {
    if (a.status !== b.status) return 0;
    // Sort by sort_order for all columns. Tasks without a sort_order (not yet
    // manually reordered) fall back to newest-updated-first.
    if (a.sort_order != null && b.sort_order != null) return a.sort_order - b.sort_order;
    if (a.sort_order != null) return -1;
    if (b.sort_order != null) return 1;
    return 0;
  });
}

export async function GET() {
  const supabase = getSupabase();

  // Tier 1: full select — project + pre_block_status
  const full = await supabase
    .from("tasks")
    .select("id,title,project,objective,status,priority,sort_order,owner,started_at,eta,blocked_reason,last_update_at,risk_state,created_at,updated_at")
    .eq("owner", OWNER)
    .order("sort_order", { ascending: true });

  if (!full.error) {
    return NextResponse.json({ tasks: sortTasks(full.data ?? []) });
  }
  if (!isOptionalColMissing(full.error.message)) {
    return NextResponse.json({ error: full.error.message }, { status: 500 });
  }

  // Fallback: project column missing — select without it
  const fallback = await supabase
    .from("tasks")
    .select("id,title,objective,status,priority,sort_order,owner,started_at,eta,blocked_reason,last_update_at,risk_state,created_at,updated_at")
    .eq("owner", OWNER)
    .order("sort_order", { ascending: true });

  if (fallback.error) return NextResponse.json({ error: fallback.error.message }, { status: 500 });
  const tasks = (fallback.data ?? []).map((t) => ({ ...t, project: null }));
  return NextResponse.json({ tasks: sortTasks(tasks) });
}

export async function POST(req: NextRequest) {
  const supabase = getSupabase();
  const body = await req.json();
  const { title, project, objective, priority } = body as {
    title?: string;
    project?: string;
    objective?: "skyworks" | "personal" | "side_hustles";
    priority?: "P0" | "P1" | "P2" | "P3";
  };

  const normalizedTitle = title?.replace(/\s+/g, " ").trim() ?? "";
  if (!normalizedTitle) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }
  if (normalizedTitle.length > 140) {
    return NextResponse.json({ error: "title must be 140 characters or less" }, { status: 400 });
  }
  if (!objective || !["skyworks", "personal", "side_hustles"].includes(objective)) {
    return NextResponse.json({ error: "invalid objective" }, { status: 400 });
  }

  const { data: existingTitles, error: existingErr } = await supabase
    .from("tasks")
    .select("id,title")
    .eq("objective", objective)
    .eq("owner", OWNER);

  if (existingErr) return NextResponse.json({ error: existingErr.message }, { status: 500 });

  const duplicate = (existingTitles ?? []).some(
    (t) => t.title.trim().toLocaleLowerCase() === normalizedTitle.toLocaleLowerCase()
  );
  if (duplicate) {
    return NextResponse.json(
      { error: "duplicate title in this objective; choose a different task title" },
      { status: 409 }
    );
  }

  const normalizedProject = (project ?? "").replace(/\s+/g, " ").trim() || null;
  if (normalizedProject && normalizedProject.length > 80) {
    return NextResponse.json({ error: "project must be 80 characters or less" }, { status: 400 });
  }

  const { data: maxRow } = await supabase
    .from("tasks")
    .select("sort_order")
    .eq("status", "backlog")
    .eq("owner", OWNER)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextSort = (maxRow?.sort_order ?? 0) + 10;

  const firstInsert = await supabase
    .from("tasks")
    .insert({
      title: normalizedTitle,
      objective,
      project: normalizedProject,
      status: "backlog",
      priority: priority ?? "P2",
      sort_order: nextSort,
      owner: OWNER,
      last_update_at: new Date().toISOString(),
      risk_state: "normal",
    })
    .select("id,title,project,objective,status,priority,sort_order,owner,started_at,eta,blocked_reason,last_update_at,risk_state,created_at,updated_at")
    .single();

  if (!firstInsert.error) return NextResponse.json({ task: firstInsert.data }, { status: 201 });
  if (!isOptionalColMissing(firstInsert.error.message)) {
    return NextResponse.json({ error: firstInsert.error.message }, { status: 500 });
  }

  // Fallback: project column missing
  console.error("[POST /api/tasks] project column missing or schema-cache error; task will be created WITHOUT project:", firstInsert.error.message);

  const fallbackInsert = await supabase
    .from("tasks")
    .insert({
      title: normalizedTitle,
      objective,
      status: "backlog",
      priority: priority ?? "P2",
      sort_order: nextSort,
      owner: OWNER,
      last_update_at: new Date().toISOString(),
      risk_state: "normal",
    })
    .select("id,title,objective,status,priority,sort_order,owner,started_at,eta,blocked_reason,last_update_at,risk_state,created_at,updated_at")
    .single();

  if (fallbackInsert.error) return NextResponse.json({ error: fallbackInsert.error.message }, { status: 500 });
  return NextResponse.json(
    { task: { ...fallbackInsert.data, project: null }, warning: "project column unavailable; project was not saved" },
    { status: 201 }
  );
}
