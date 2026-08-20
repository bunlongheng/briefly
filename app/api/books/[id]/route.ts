import { NextRequest, NextResponse } from "next/server";
import { existsSync, rmSync } from "fs";
import db, { audioPath, alignPath, type BookRow } from "@/lib/db";
import { authorized } from "@/lib/auth";
import { writeManifest } from "@/lib/manifest";

export const runtime = "nodejs";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const row = db
    .prepare("SELECT * FROM books WHERE id=?")
    .get(id) as BookRow | undefined;
  if (!row) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(row);
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!authorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const row = db.prepare("SELECT id FROM books WHERE id=?").get(id) as { id: number } | undefined;
  if (!row) return NextResponse.json({ error: "not found" }, { status: 404 });

  db.prepare("DELETE FROM books WHERE id=?").run(id);
  for (const p of [audioPath(id), alignPath(id)]) if (existsSync(p)) rmSync(p);
  writeManifest();
  return NextResponse.json({ ok: true });
}
