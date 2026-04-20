import { NextResponse } from "next/server";

import { requireAdminFromApi } from "@/lib/live/api-auth";
import { blobResultToResponse, getBlobForViewer } from "@/lib/live/blob";
import { getScreenshotById } from "@/lib/live/db/screenshots";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: Params) {
  const admin = await requireAdminFromApi();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const screenshot = await getScreenshotById(id);
  if (!screenshot) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const blob = await getBlobForViewer(screenshot.blob_url);
  if (!blob) {
    return NextResponse.json({ error: "Blob not found" }, { status: 404 });
  }

  return blobResultToResponse(blob);
}
