import { type GetBlobResult, get } from "@vercel/blob";

const BLOB_TOKEN_ENV_KEYS = ["BLOB_READ_WRITE_TOKEN", "VERCEL_BLOB_READ_WRITE_TOKEN"] as const;

function resolveBlobToken(): string | null {
  for (const key of BLOB_TOKEN_ENV_KEYS) {
    const value = process.env[key];
    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }
  return null;
}

export function getBlobReadWriteToken(): string {
  const token = resolveBlobToken();
  if (!token) {
    throw new Error("Brak tokena Vercel Blob w ENV (BLOB_READ_WRITE_TOKEN).");
  }
  return token;
}

function shouldRetryAsPublic(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return message.includes("private") || message.includes("public") || message.includes("access");
}

export async function getBlobForViewer(blobUrlOrPathname: string): Promise<GetBlobResult | null> {
  const token = getBlobReadWriteToken();

  try {
    return await get(blobUrlOrPathname, {
      access: "private",
      token,
      useCache: false,
    });
  } catch (error) {
    if (!shouldRetryAsPublic(error)) {
      throw error;
    }

    return await get(blobUrlOrPathname, {
      access: "public",
      token,
    });
  }
}

export function blobResultToResponse(blobResult: GetBlobResult): Response {
  if (blobResult.statusCode !== 200 || !blobResult.stream) {
    return new Response(null, { status: 404 });
  }

  const headers = new Headers();
  headers.set("Content-Type", blobResult.blob.contentType);
  headers.set("Content-Disposition", blobResult.blob.contentDisposition || "inline");
  headers.set("Cache-Control", "private, no-store");

  return new Response(blobResult.stream, {
    status: 200,
    headers,
  });
}
