import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth.config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth?.user;
  const role = req.auth?.user?.role;

  // Routes that require authentication
  const authRequired = ["/dashboard", "/blog/new", "/podcasts/new", "/profile"];
  const needsAuth = authRequired.some((route) => pathname.startsWith(route));

  if (needsAuth && !isLoggedIn) {
    const signInUrl = new URL("/auth/signin", req.nextUrl.origin);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  // Routes that require AUTHOR or ADMIN role
  const authorRoutes = ["/blog/new", "/podcasts/new"];
  const needsAuthor = authorRoutes.some((route) => pathname.startsWith(route));

  if (needsAuthor && isLoggedIn && role !== "AUTHOR" && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard?error=insufficient_role", req.nextUrl.origin));
  }

  // Routes that require ADMIN role
  const adminRoutes = ["/admin"];
  const needsAdmin = adminRoutes.some((route) => pathname.startsWith(route));

  if (needsAdmin && isLoggedIn && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard?error=admin_required", req.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*", "/blog/new", "/podcasts/new", "/profile/:path*", "/admin/:path*"],
};
