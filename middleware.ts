/**
 * 🚨 CRITICAL MIDDLEWARE CONFIGURATION 🚨
 * 
 * ⚠️  WARNING: DO NOT MODIFY THE MATCHER CONFIGURATION BELOW! ⚠️
 * 
 * This configuration is specifically designed to prevent common Clerk authentication errors.
 * Modifying the matcher can cause API routes to bypass authentication middleware,
 * resulting in "Clerk can't detect clerkMiddleware" errors.
 * 
 * Common mistakes that WILL break authentication:
 * ❌ Using negative lookahead to exclude 'api' in the main pattern
 * ❌ Missing explicit '/api/(.*)' matcher
 * ❌ Only matching page routes without API routes
 * 
 * If you need to modify routing behavior, update the route matchers below instead.
 */

import { NextResponse } from "next/server";

import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { get } from "@vercel/edge-config";
import createMiddleware from "next-intl/middleware";

import { kvKeys } from "@/config/kv";
import { env } from "@/env.mjs";
import countries from "@/lib/countries.json";
import { getIP } from "@/lib/ip";
// Redis functionality removed for simplicity

import { defaultLocale, localePrefix, locales } from "./config";

// 🔒 LOCKED CONFIGURATION - DO NOT MODIFY
// This matcher ensures ALL routes that need authentication are processed by Clerk middleware
export const config = {
  matcher: [
    // Match all page routes (except Next.js internals)
    "/((?!_next|_static|.*\\..*).*)",
    // ⚠️ CRITICAL: Include ALL API routes for Clerk authentication
    "/api/(.*)"
  ],
};

// ✅ SAFE TO MODIFY: Route-specific configurations
const isProtectedRoute = createRouteMatcher([
  "/:locale/app(.*)",     // Protected app pages
  "/:locale/admin(.*)",   // Protected admin pages
]);

const isPublicRoute = createRouteMatcher([
  "/api/webhooks(.*)",    // Public webhook endpoints
  "/api/health(.*)",      // Health check endpoints (if any)
]);

// Next-intl middleware configuration
const nextIntlMiddleware = createMiddleware({
  defaultLocale,
  locales,
  localePrefix,
});

// Runtime validation to prevent configuration errors
function validateMiddlewareConfig() {
  const matchers = config.matcher;
  const hasApiMatcher = matchers.some(pattern => 
    pattern.includes('/api/') || pattern.includes('api')
  );
  
  if (!hasApiMatcher) {
    console.error('🚨 CRITICAL ERROR: Middleware matcher does not include API routes!');
    console.error('This will cause Clerk authentication to fail on API endpoints.');
    console.error('Please check your middleware.ts configuration.');
    throw new Error('Invalid middleware configuration: API routes not included in matcher');
  }
  
  // Check for common problematic patterns
  const problematicPattern = matchers.find(pattern => 
    pattern.includes('(?!api') || pattern.includes('!api')
  );
  
  if (problematicPattern) {
    console.error('🚨 CRITICAL ERROR: Middleware matcher excludes API routes!');
    console.error(`Problematic pattern: ${problematicPattern}`);
    console.error('This will cause "Clerk can\'t detect clerkMiddleware" errors.');
    throw new Error('Invalid middleware configuration: API routes excluded from matcher');
  }
}

// Run validation in development
if (process.env.NODE_ENV === 'development') {
  validateMiddlewareConfig();
}

export default clerkMiddleware(async (auth, req) => {
  const { userId, redirectToSignIn } = auth();
  const { geo, nextUrl } = req;
  const isApi = nextUrl.pathname.startsWith("/api/");

  // Debug logging in development
  if (process.env.NODE_ENV === 'development' && isApi) {
    console.log(`🔐 Clerk middleware processing API route: ${nextUrl.pathname}`);
  }

  // Handle public routes (no authentication required)
  if (isPublicRoute(req)) {
    return;
  }
  
  // Handle protected routes (authentication required)
  if (isProtectedRoute(req)) {
    if (!userId) {
      return redirectToSignIn();
    }
    auth().protect();
  }

  // IP blocking logic (if Edge Config is available)
  if (process.env.EDGE_CONFIG && env.VERCEL_ENV !== "development") {
    const blockedIPs = await get<string[]>("blocked_ips");
    const ip = getIP(req);
    console.log("ip-->", ip);

    if (blockedIPs?.includes(ip)) {
      if (isApi) {
        return NextResponse.json(
          { error: "You have been blocked." },
          { status: 403 },
        );
      }

      nextUrl.pathname = "/blocked";
      return NextResponse.rewrite(nextUrl);
    }

    if (nextUrl.pathname === "/blocked") {
      nextUrl.pathname = "/";
      return NextResponse.redirect(nextUrl);
    }
  }

  // Geolocation tracking (if available and not API request)
  if (geo && !isApi && env.VERCEL_ENV !== "development") {
    console.log("geo-->", geo);
    const country = geo.country;
    const city = geo.city;

    const countryInfo = countries.find((x) => x.cca2 === country);
    if (countryInfo) {
      const flag = countryInfo.flag;
      // Redis tracking is temporarily disabled
      // await redis.set(kvKeys.currentVisitor, { country, city, flag });
      console.log("Visitor info:", { country, city, flag });
    }
  }

  // For API routes, let Clerk handle authentication
  // For page routes, use next-intl middleware
  if (isApi) {
    return;
  }

  return nextIntlMiddleware(req);
});