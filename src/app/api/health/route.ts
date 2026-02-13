// =============================================================================
// GET /api/health -- Health check endpoint (public, no auth)
// =============================================================================

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const startTime = Date.now();

export async function GET() {
  const timestamp = new Date().toISOString();
  const uptimeMs = Date.now() - startTime;
  const uptimeSeconds = Math.floor(uptimeMs / 1000);

  let dbStatus: "connected" | "unreachable" = "connected";

  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    dbStatus = "unreachable";
  }

  const isHealthy = dbStatus === "connected";

  return NextResponse.json(
    {
      status: isHealthy ? "ok" : "degraded",
      timestamp,
      version: process.env.npm_package_version || "0.0.0",
      uptime: uptimeSeconds,
      environment: process.env.NODE_ENV,
      db: dbStatus,
    },
    { status: isHealthy ? 200 : 503 }
  );
}
