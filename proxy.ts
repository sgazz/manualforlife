import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_APP_HOST = "app.manualfor.life";

export function proxy(request: NextRequest) {
  if (process.env.VERCEL_ENV !== "production") {
    return NextResponse.next();
  }

  const host = request.headers.get("host")?.split(":")[0] ?? "";
  if (host === PUBLIC_APP_HOST || !host.endsWith(".vercel.app")) {
    return NextResponse.next();
  }

  const destination = new URL(request.nextUrl.pathname + request.nextUrl.search, `https://${PUBLIC_APP_HOST}`);
  return NextResponse.redirect(destination, 308);
}

export const config = {
  matcher: "/:path*",
};
