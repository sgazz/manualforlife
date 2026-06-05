import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

const LANDING_ORIGINS = ["https://manualfor.life", "https://www.manualfor.life"];

function withLandingCors(response: NextResponse, request: Request) {
  const origin = request.headers.get("origin");
  if (origin && LANDING_ORIGINS.includes(origin)) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Vary", "Origin");
  }
  return response;
}

export async function OPTIONS(request: Request) {
  const response = new NextResponse(null, { status: 204 });
  response.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type");
  return withLandingCors(response, request);
}

export async function GET(request: Request) {
  const { count, error } = await supabaseServer
    .from("entries")
    .select("*", { count: "exact", head: true });

  if (error) {
    return withLandingCors(
      NextResponse.json(
        { error: "Failed to load trace count." },
        { status: 500 },
      ),
      request,
    );
  }

  return withLandingCors(
    NextResponse.json({ count: count ?? 0 }, { status: 200 }),
    request,
  );
}
