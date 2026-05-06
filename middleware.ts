import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware() {
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;

        // Allow auth-related routes
        if (
          pathname.startsWith("/api/auth") ||
          pathname === "/login" ||
          pathname === "/register"
        ) {
          return true;
        }

        // Public routes (Allow viewing, but sensitive data will be handled at API level if needed)
        if (
          pathname === "/" ||
          pathname.startsWith("/api/videos") ||
          pathname.startsWith("/api/images")
        ) {
          return true;
        }

        // Admin-only routes
        if (
          pathname.startsWith("/api/reels") ||
          pathname.startsWith("/api/media") ||
          pathname.startsWith("/api/users") ||
          pathname.startsWith("/admin")
        ) {
          return token?.role === "admin";
        }

        // All other routes require basic authentication
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public/).*)",
  ],
};
