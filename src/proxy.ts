import { NextResponse, type NextRequest } from "next/server";
import { isAdminAuthorized } from "@/lib/server/admin-auth";

/** Password-protects the admin page and admin API (HTTP Basic, user "admin"). */
export function proxy(request: NextRequest) {
  if (isAdminAuthorized(request.headers.get("authorization"))) return NextResponse.next();
  if (!process.env.ADMIN_PASSWORD) return new NextResponse("Not found", { status: 404 });
  return new NextResponse("Authentication required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="ARIVO admin", charset="UTF-8"', "Cache-Control": "no-store" },
  });
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
