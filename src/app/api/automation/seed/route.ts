import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

const OWNER = "Eva";

const TASKS: { title: string; objective: "skyworks" | "personal" | "side_hustles"; status: "backlog" | "in_progress" | "completed" }[] = [
  { title: "Implement project assignment field per task", objective: "skyworks", status: "in_progress" },
  { title: "Add project filter (single-project view)", objective: "skyworks", status: "backlog" },
  { title: "Refine mobile UX spacing and touch targets", objective: "personal", status: "in_progress" },
  { title: "Add configurable background image + overlay controls", objective: "personal", status: "backlog" },
  { title: "Evaluate additional workflow stage utility (optional)", objective: "side_hustles", status: "backlog" },
  { title: "Add drag-and-drop column movement", objective: "skyworks", status: "backlog" },
  { title: "Add lightweight activity/audit history panel", objective: "side_hustles", status: "backlog" },
  { title: "UI polish pass inspired by award-winning software patterns", objective: "personal", status: "backlog" },
  { title: "Add duplicate-title guard and task validation rules", objective: "skyworks", status: "backlog" },
  { title: "Prepare vNext test checklist for Patrick", objective: "personal", status: "backlog" }
];

export async function GET(req: NextRequest) {
  const supabase = getSupabase();
  const token = req.nextUrl.searchParams.get("token");
  const reset = req.nextUrl.searchParams.get("reset") === "1";

  if (!process.env.KB_AUTOMATION_TOKEN) {
    return NextResponse.json({ error: "KB_AUTOMATION_TOKEN not configured" }, { status: 500 });
  }

  if (!token || token !== process.env.KB_AUTOMATION_TOKEN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (reset) {
    const { error: delErr } = await supabase.from("tasks").delete().eq("owner", OWNER);
    if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 });
  }

  const { data: existing, error: existingErr } = await supabase.from("tasks").select("title").eq("owner", OWNER);
  if (existingErr) return NextResponse.json({ error: existingErr.message }, { status: 500 });

  const existingTitles = new Set((existing || []).map((t) => t.title));
  const toInsert = TASKS.filter((t) => !existingTitles.has(t.title));

  if (toInsert.length === 0) {
    return NextResponse.json({ ok: true, inserted: 0, message: "No new tasks to insert" });
  }

  const payload = toInsert.map((t) => ({
    ...t,
    owner: OWNER,
    priority: "P2" as const,
    risk_state: "normal" as const,
    last_update_at: new Date().toISOString(),
  }));

  const { error: insertErr } = await supabase.from("tasks").insert(payload);
  if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 });

  return NextResponse.json({ ok: true, inserted: toInsert.length });
}
