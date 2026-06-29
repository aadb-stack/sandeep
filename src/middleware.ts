import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { env } from "@/lib/env";

/**
 * Clerk authentication middleware. When Clerk is configured we delegate to
 * `clerkMiddleware()`; otherwise every request passes through untouched so the
 * app runs fully in keyless mock mode.
 */
const handler = env.hasClerk ? clerkMiddleware() : () => NextResponse.next();

export default handler;

export const config = {
  matcher: [
    // Skip Next internals and static files, run on everything else.
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
