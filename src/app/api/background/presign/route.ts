import { NextResponse } from "next/server";
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

// POST — return a signed upload URL for direct browser-to-Supabase upload.
export async function POST() {
  const supabase = getServiceClient();

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUploadUrl(PATH, { upsertEnabled: true });

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Failed to create signed URL" }, { status: 500 });
  }

  const { data: publicData } = supabase.storage.from(BUCKET).getPublicUrl(PATH);

  return NextResponse.json({
    signedUrl: data.signedUrl,
    publicUrl: `${publicData.publicUrl}?t=${Date.now()}`,
  });
}
