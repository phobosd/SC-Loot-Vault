import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Unauthenticated handling
    if (!token) {
      if (path.startsWith("/api") && !path.startsWith("/api/auth")) {
        return new NextResponse(
          JSON.stringify({ error: "Unauthorized" }),
          { status: 401, headers: { 'content-type': 'application/json' } }
        );
      } else if (!path.startsWith("/api")) {
         return NextResponse.redirect(new URL("/login", req.url));
      }
    }

    // Admin-only UI routes
    if (path.startsWith("/users") || path.startsWith("/settings")) {
      if (token?.role !== "ADMIN" && token?.role !== "SUPERADMIN") {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }
  },
  {
    callbacks: {
      authorized: () => true, // We handle the auth check inside the middleware to allow custom 401 responses for API
    },
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/vault/:path*",
    "/users/:path*",
    "/settings/:path*",
    "/discord/:path*",
    "/distributions/:path*",
    "/logs/:path*",
    "/api/:path*",
  ],
};
