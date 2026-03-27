import fs from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";

import { getModuleBySlug } from "@/lib/modules";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const moduleMeta = getModuleBySlug(slug);
  if (!moduleMeta) {
    return NextResponse.json({ error: "Module not found" }, { status: 404 });
  }

  const numberedName = `${String(moduleMeta.number).padStart(2, "0")}-${moduleMeta.slug}.mdx`;
  const sourcePath = path.join(process.cwd(), "src", "content", "modules", numberedName);
  const raw = await fs.readFile(sourcePath, "utf8").catch(() => null);
  if (!raw) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  return new NextResponse(raw, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="${numberedName}"`,
      "Cache-Control": "no-store",
    },
  });
}
