import fs from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  if (!/^[a-z0-9-]+$/i.test(slug)) {
    return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
  }

  const sourcePath = path.join(process.cwd(), "src", "content", "materials", `${slug}.mdx`);
  const raw = await fs.readFile(sourcePath, "utf8").catch(() => null);
  if (!raw) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  return new NextResponse(raw, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="${slug}.mdx"`,
      "Cache-Control": "no-store",
    },
  });
}
