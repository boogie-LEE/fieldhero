import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // Temporarily disable all Supabase logic to ensure the site can load
  return NextResponse.next({ request });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
