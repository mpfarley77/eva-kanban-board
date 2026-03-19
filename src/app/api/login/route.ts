import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { password } = await req.json();

  if (!process.env.KB_PASSWORD || !process.env.KB_AUTH_TOKEN) {
    return NextResponse.json(
      { error: "Server auth env vars not configured" },
      { status: 500 }
    );
  }

  if (password !== process.env.KB_PASSWORD) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set("kb_auth", process.env.KB_AUTH_TOKEN, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  return res;
}
