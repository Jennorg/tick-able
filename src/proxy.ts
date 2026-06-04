import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname, origin } = request.nextUrl;
  const role = user?.user_metadata?.role || "user";
  const isSuperAdmin = user?.user_metadata?.is_superadmin === true || role === "superadmin";

  // Protect routes
  if (
    !user &&
    !pathname.startsWith("/login") &&
    !pathname.startsWith("/register") &&
    !pathname.startsWith("/portal") &&
    !pathname.startsWith("/api") &&
    pathname !== "/"
  ) {
    const loginUrl = new URL("/login", origin);
    return NextResponse.redirect(loginUrl);
  }

  if (user) {
    if (pathname.startsWith("/login") || pathname.startsWith("/register")) {
      const targetUrl = role === "user" ? "/tickets" : "/dashboard";
      return NextResponse.redirect(new URL(targetUrl, origin));
    }

    const defaultRedirect = role === "user" ? "/tickets" : "/dashboard";

    // Role-based protection
    if (pathname.startsWith("/admin") && role !== "admin" && !isSuperAdmin) {
      return NextResponse.redirect(new URL(defaultRedirect, origin));
    }

    if (pathname.startsWith("/dashboard") && role === "user") {
      return NextResponse.redirect(new URL("/tickets", origin));
    }

    if (pathname.startsWith("/metrics") && role === "user") {
      return NextResponse.redirect(new URL("/tickets", origin));
    }

    if (pathname.startsWith("/tickets/new") && role !== "user" && !isSuperAdmin) {
      return NextResponse.redirect(new URL("/dashboard", origin));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
