import { type NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { findProviderEndpointProbeLogsBatch } from "@/repository";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);

  const endpointIdsRaw = searchParams.get("endpointIds");
  const limitRaw = searchParams.get("limit");

  if (!endpointIdsRaw) {
    return NextResponse.json({ error: "endpointIds is required" }, { status: 400 });
  }

  const endpointIds = endpointIdsRaw
    .split(",")
    .map((id) => Number.parseInt(id.trim(), 10))
    .filter((id) => Number.isFinite(id) && id > 0);

  if (endpointIds.length === 0) {
    return NextResponse.json({ error: "No valid endpoint IDs provided" }, { status: 400 });
  }

  // Limit to 100 endpoints per request
  if (endpointIds.length > 100) {
    return NextResponse.json({ error: "Too many endpoint IDs (max 100)" }, { status: 400 });
  }

  const limit = limitRaw ? Number.parseInt(limitRaw, 10) : 30;
  if (!Number.isFinite(limit) || limit <= 0 || limit > 100) {
    return NextResponse.json({ error: "Invalid limit (1-100)" }, { status: 400 });
  }

  try {
    const logsMap = await findProviderEndpointProbeLogsBatch(endpointIds, limit);

    // Convert Map to object for JSON serialization
    const logs: Record<string, Array<unknown>> = {};
    for (const [endpointId, probeLogs] of logsMap) {
      logs[endpointId.toString()] = probeLogs;
    }

    return NextResponse.json({ logs });
  } catch (error) {
    console.error("Batch probe logs API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
