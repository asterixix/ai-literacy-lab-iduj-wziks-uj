import fs from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";

import { trackDownload } from "@/lib/download-tracking";
import { getModuleBySlug } from "@/lib/modules";

export async function GET(
  request: Request,
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

  trackDownload({
    request,
    slug,
    fileName: numberedName,
    kind: "module",
    category: `module-${String(moduleMeta.number).padStart(2, "0")}`,
    availability: "available",
    moduleNumber: moduleMeta.number,
  });

  return new NextResponse(raw, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="${numberedName}"`,
      "Cache-Control": "no-store",
    },
  });
}
