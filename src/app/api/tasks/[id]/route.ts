import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

type Status = "backlog" | "in_progress" | "review" | "blocked" | "completed";
const OWNER = "Eva";
const OPTIONAL_COLS = ["project", "pre_block_status"];
function isOptionalColMissing(msg: string) {
  const m = msg.toLowerCase();
  return (m.includes("does not exist") || m.includes("schema cache")) &&
    OPTIONAL_COLS.some((col) => m.includes(col));
}

function isNoRows(msg: string) {
  const m = msg.toLowerCase();
  return m.includes("0 rows") || m.includes("no rows") || m.includes("multiple (or no) rows returned");
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = getSupabase();
  const { id } = await params;
  const body = await req.json();

  const updates: Record<string, unknown> = { last_update_at: new Date().toISOString() };

  if (body.status) {
    if (!["backlog", "in_progress", "review", "blocked", "completed"].includes(body.status)) {
      return NextResponse.json({ error: "invalid status" }, { status: 400 });
    }
    updates.status = body.status as Status;
    if (body.status === "in_progress") {
      updates.started_at = updates.started_at ?? new Date().toISOString();
    }
  }

  if (body.priority) {
    if (!["P0", "P1", "P2", "P3"].includes(body.priority)) {
      return NextResponse.json({ error: "invalid priority" }, { status: 400 });
    }
    updates.priority = body.priority;
  }

  if (typeof body.sort_order === "number") updates.sort_order = body.sort_order;

  if (typeof body.blocked_reason === "string") {
    const blocked = body.blocked_reason.replace(/\s+/g, " ").trim();
    if (blocked.length > 300) {
      return NextResponse.json({ error: "blocked_reason must be 300 characters or less" }, { status: 400 });
    }
    updates.blocked_reason = blocked || null;
  }

  if (typeof body.risk_state === "string") {
    if (!["normal", "watch", "at_risk", "blocked"].includes(body.risk_state)) {
      return NextResponse.json({ error: "invalid risk_state" }, { status: 400 });
    }
    updates.risk_state = body.risk_state;
  }

  if (typeof body.project === "string") {
    const normalizedProject = body.project.replace(/\s+/g, " ").trim();
    if (normalizedProject.length > 80) {
      return NextResponse.json({ error: "project must be 80 characters or less" }, { status: 400 });
    }
    updates.project = normalizedProject || null;
  }

  if (typeof body.eta === "string") {
    const eta = body.eta.trim();
    if (!eta) {
      updates.eta = null;
    } else if (Number.isNaN(Date.parse(eta))) {
      return NextResponse.json({ error: "eta must be a valid date/time string" }, { status: 400 });
    } else {
      updates.eta = eta;
    }
  }

  const withProject = await supabase
    .from("tasks")
    .update(updates)
    .eq("id", id)
    .eq("owner", OWNER)
    .select("id,title,project,objective,status,priority,sort_order,owner,started_at,eta,blocked_reason,last_update_at,risk_state,created_at,updated_at")
    .single();

  if (!withProject.error) return NextResponse.json({ task: withProject.data });
  if (isNoRows(withProject.error.message)) {
    return NextResponse.json({ error: "task not found for owner" }, { status: 404 });
  }
  if (!isOptionalColMissing(withProject.error.message)) {
    return NextResponse.json({ error: withProject.error.message }, { status: 500 });
  }

  // Fallback: project column missing — strip it from both updates and SELECT
  const fallbackUpdates = { ...updates } as Record<string, unknown>;
  delete fallbackUpdates.project;

  const fallback = await supabase
    .from("tasks")
    .update(fallbackUpdates)
    .eq("id", id)
    .eq("owner", OWNER)
    .select("id,title,objective,status,priority,sort_order,owner,started_at,eta,blocked_reason,last_update_at,risk_state,created_at,updated_at")
    .single();

  if (fallback.error) {
    if (isNoRows(fallback.error.message)) {
      return NextResponse.json({ error: "task not found for owner" }, { status: 404 });
    }
    return NextResponse.json({ error: fallback.error.message }, { status: 500 });
  }
  return NextResponse.json({ task: { ...fallback.data, project: null } });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = getSupabase();
  const { id } = await params;

  const { data: existing, error: checkErr } = await supabase
    .from("tasks")
    .select("id")
    .eq("id", id)
    .eq("owner", OWNER)
    .maybeSingle();

  if (checkErr) return NextResponse.json({ error: checkErr.message }, { status: 500 });
  if (!existing) return NextResponse.json({ error: "task not found for owner" }, { status: 404 });

  const { error } = await supabase.from("tasks").delete().eq("id", id).eq("owner", OWNER);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
