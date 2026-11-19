import { type NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  // Temporarily bypass all auth logic so the site loads.
  // We'll re-enable Supabase auth once we confirm the site is stable.
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
