// =============================================================================
// POST /api/upload — File upload endpoint
// Accepts multipart form data, validates file type and size, saves to the
// public/uploads/ directory with a unique filename.
// =============================================================================

import { NextRequest } from "next/server";
import crypto from "crypto";
import path from "path";
import { writeFile, mkdir } from "fs/promises";
import {
  apiResponse,
  apiError,
  handleApiError,
  requireAuth,
} from "@/lib/utils/api";
import { withRateLimit } from "@/lib/utils/rate-limit";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Maximum file size: 10 MB */
const MAX_FILE_SIZE = 10 * 1024 * 1024;

/** Allowed MIME type prefixes and exact types */
const ALLOWED_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "application/pdf",
];

/** Map MIME types to file extensions when the original name is unavailable */
const MIME_TO_EXT: Record<string, string> = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/gif": ".gif",
  "image/webp": ".webp",
  "image/svg+xml": ".svg",
  "application/pdf": ".pdf",
};

// ---------------------------------------------------------------------------
// POST handler — Upload a file
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    // Rate limit: 20 uploads per minute per user
    const rateLimited = withRateLimit(request, `upload:${user.id}`, 20, 60_000);
    if (rateLimited) return rateLimited;

    // Parse multipart form data
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return apiError("Invalid form data", 400, "BAD_REQUEST");
    }

    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return apiError(
        'No file provided. Send a file with the field name "file".',
        400,
        "BAD_REQUEST"
      );
    }

    // --- Validation ---

    // 1. Check file size
    if (file.size > MAX_FILE_SIZE) {
      return apiError(
        `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB.`,
        400,
        "FILE_TOO_LARGE",
        { maxSize: MAX_FILE_SIZE, actualSize: file.size }
      );
    }

    // 2. Check MIME type
    const mimeType = file.type.toLowerCase();
    const isAllowed =
      ALLOWED_TYPES.includes(mimeType) || mimeType.startsWith("image/");

    if (!isAllowed) {
      return apiError(
        "File type not allowed. Accepted types: images and PDF.",
        400,
        "INVALID_FILE_TYPE",
        { type: mimeType }
      );
    }

    // --- Generate unique filename ---
    const originalName = file.name || "upload";
    const originalExt = path.extname(originalName);
    const ext =
      originalExt ||
      MIME_TO_EXT[mimeType] ||
      `.${mimeType.split("/")[1] || "bin"}`;
    const uniqueName = `${crypto.randomUUID()}${ext}`;

    // --- Write file to disk ---
    const uploadsDir = path.join(process.cwd(), "public", "uploads");

    // Ensure the uploads directory exists
    await mkdir(uploadsDir, { recursive: true });

    const filePath = path.join(uploadsDir, uniqueName);
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);

    const url = `/uploads/${uniqueName}`;

    return apiResponse(
      {
        url,
        filename: uniqueName,
        originalName: file.name || "upload",
        size: file.size,
        type: mimeType,
      },
      201
    );
  } catch (error) {
    return handleApiError(error);
  }
}
