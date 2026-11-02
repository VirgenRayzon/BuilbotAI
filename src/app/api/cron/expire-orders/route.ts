import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getOrderActor } from "@/lib/server/order-auth";
import { runExpiredOrdersSweep } from "@/lib/server/order-expiration-sweep";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function matchesCronSecret(bearerToken: string, cronSecret: string): boolean {
  const a = Buffer.from(bearerToken, "utf8");
  const b = Buffer.from(cronSecret, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

async function authorizeExpirationJob(
  req: NextRequest
): Promise<{ authorized: boolean; actorUid: string; status: number; error?: string }> {
  const authHeader = req.headers.get("authorization") || "";
  const bearerToken = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : "";
  const staffToken = req.headers.get("x-staff-id-token")?.trim() || "";
  const cronSecret = process.env.CRON_SECRET?.trim() || "";

  if (cronSecret && bearerToken && matchesCronSecret(bearerToken, cronSecret)) {
    return { authorized: true, actorUid: "cron_job", status: 200 };
  }

  const candidateIdToken = staffToken || (!cronSecret ? bearerToken : "");
  if (candidateIdToken) {
    try {
      const { decoded, isStaff } = await getOrderActor(candidateIdToken);
      if (isStaff) {
        return { authorized: true, actorUid: decoded.uid, status: 200 };
      }
    } catch {
      return {
        authorized: false,
        actorUid: "",
        status: 401,
        error: "Invalid staff authorization token.",
      };
    }
  }

  if (!cronSecret) {
    return {
      authorized: false,
      actorUid: "",
      status: 503,
      error: "CRON_SECRET is not configured and no verified staff token was provided.",
    };
  }

  return {
    authorized: false,
    actorUid: "",
    status: 401,
    error: "Unauthorized expiration sweep request.",
  };
}

async function handleSweep(req: NextRequest) {
  const auth = await authorizeExpirationJob(req);
  if (!auth.authorized) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  const result = await runExpiredOrdersSweep(auth.actorUid);
  if (!result.success) {
    return NextResponse.json(result, { status: 500 });
  }

  return NextResponse.json({
    ...result,
    sweptAt: new Date().toISOString(),
  });
}

export async function GET(req: NextRequest) {
  return handleSweep(req);
}

export async function POST(req: NextRequest) {
  return handleSweep(req);
}

