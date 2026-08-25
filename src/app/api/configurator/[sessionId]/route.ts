import type { NextRequest } from "next/server";
import { GET as getSession } from "@/server/publicRoutes/configurator";

/**
 * Real mount point for fetching a Configurator session summary. Logic
 * lives in src/server/publicRoutes/configurator.ts.
 */
type RouteParams = { params: Promise<{ sessionId: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { sessionId } = await params;
  return getSession(request, sessionId);
}
