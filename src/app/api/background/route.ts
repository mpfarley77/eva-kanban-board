import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const BUCKET = "backgrounds";
const PATH = "board-bg";

function getServiceClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");
  }
  return createClient(url, key);
}

// GET — return the current background public URL, or null if none uploaded.
export async function GET() {
  const supabase = getServiceClient();

  const { data: files, error } = await supabase.storage.from(BUCKET).list("", { search: PATH });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const exists = files?.some((f) => f.name === PATH);
  if (!exists) return NextResponse.json({ url: null });

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(PATH);
  // Bust cache so the browser always fetches the latest upload.
  return NextResponse.json({ url: `${data.publicUrl}?t=${Date.now()}` });
}

// POST — upload an image file, overwrite any existing board-bg.
export async function POST(req: NextRequest) {
  const supabase = getServiceClient();

  const form = await req.formData();
  const file = form.get("file");
  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const contentType = file.type || "image/jpeg";

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(PATH, buffer, { contentType, upsert: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(PATH);
  return NextResponse.json({ url: `${data.publicUrl}?t=${Date.now()}` });
}

// DELETE — remove the background image from the bucket.
export async function DELETE() {
  const supabase = getServiceClient();

  const { error } = await supabase.storage.from(BUCKET).remove([PATH]);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
