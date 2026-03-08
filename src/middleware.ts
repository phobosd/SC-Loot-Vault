import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Unauthenticated handling
    if (!token) {
      const isPublicApi = path.startsWith("/api/auth") || (path === "/api/orgs" && req.nextUrl.searchParams.get("signup") === "true");
      
      if (path.startsWith("/api") && !isPublicApi) {
        return new NextResponse(
          JSON.stringify({ error: "Unauthorized" }),
          { status: 401, headers: { 'content-type': 'application/json' } }
        );
      } else if (!path.startsWith("/api")) {
         const url = req.nextUrl.clone();
         url.pathname = "/login";
         return NextResponse.redirect(url);
      }
    }

    // Admin-only UI routes
    if (path.startsWith("/users") || path.startsWith("/settings")) {
      if (token?.role !== "ADMIN" && token?.role !== "SUPERADMIN") {
        const url = req.nextUrl.clone();
        url.pathname = "/dashboard";
        return NextResponse.redirect(url);
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
    "/wishlist/:path*",
  ],
};
