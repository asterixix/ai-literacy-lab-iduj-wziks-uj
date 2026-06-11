import fs from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";

import { trackDownload } from "@/lib/download-tracking";
import { getMaterialById } from "@/lib/materials";

const materialsDir = path.join(process.cwd(), "src", "content", "materials");

function getMimeType(fileName: string): string {
  const extension = path.extname(fileName).toLowerCase();

  switch (extension) {
    case ".pdf":
      return "application/pdf";
    case ".mdx":
      return "text/markdown; charset=utf-8";
    case ".gguf":
      return "application/octet-stream";
    default:
      return "application/octet-stream";
  }
}

function getDownloadFormat(fileName: string): string {
  const extension = path.extname(fileName).replace(/^\./, "").toLowerCase();
  return extension || "unknown";
}

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!/^[a-z0-9-]+$/i.test(slug)) {
    return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
  }

  const material = getMaterialById(slug);
  const fileName = material?.fileName ?? `${slug}.mdx`;
  const sourcePath = path.join(materialsDir, fileName);
  const raw = await fs.readFile(sourcePath).catch(() => null);

  if (!raw) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  trackDownload({
    request,
    slug,
    fileName,
    kind: "material",
    category: material?.category ?? "unknown",
    availability: material ? (material.available ? "available" : "scheduled") : "unknown",
    format: getDownloadFormat(fileName),
  });

  return new NextResponse(new Uint8Array(raw), {
    headers: {
      "Content-Type": getMimeType(fileName),
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Cache-Control": "no-store",
    },
  });
}
