#!/usr/bin/env node

/**
 * Middleware Configuration Validator
 * 
 * This script validates that the middleware.ts configuration
 * is correct and won't cause Clerk authentication errors.
 */

const fs = require('fs');
const path = require('path');

const MIDDLEWARE_PATH = path.join(process.cwd(), 'middleware.ts');
const COLORS = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(color, message) {
  console.log(`${color}${message}${COLORS.reset}`);
}

function validateMiddleware() {
  log(COLORS.blue, '🔍 Validating middleware configuration...\n');

  // Check if middleware.ts exists
  if (!fs.existsSync(MIDDLEWARE_PATH)) {
    log(COLORS.red, '❌ ERROR: middleware.ts not found!');
    process.exit(1);
  }

  const content = fs.readFileSync(MIDDLEWARE_PATH, 'utf8');
  let hasErrors = false;
  let hasWarnings = false;

  // Check 1: Ensure API routes are included in matcher
  const matcherRegex = /matcher:\s*\[([\s\S]*?)\]/;
  const matcherMatch = content.match(matcherRegex);
  
  if (!matcherMatch) {
    log(COLORS.red, '❌ ERROR: No matcher configuration found in middleware.ts');
    hasErrors = true;
  } else {
    const matcherContent = matcherMatch[1];
    
    // Remove comments and strings to avoid false positives
    const cleanContent = matcherContent
      .replace(/\/\/.*$/gm, '')  // Remove line comments
      .replace(/\/\*[\s\S]*?\*\//g, '')  // Remove block comments
      .replace(/["'`]([^"'`\\]|\\.)*["'`]/g, ''); // Remove string literals (but keep the actual matcher strings)
    
    // Check if API routes are included in the actual matcher array
    const hasApiRoute = /["'`]\/api\/\([^"'`]*\)["'`]/.test(matcherContent) || 
                       /["'`][^"'`]*api[^"'`]*["'`]/.test(matcherContent);
    
    if (!hasApiRoute) {
      log(COLORS.red, '❌ CRITICAL ERROR: API routes not included in matcher!');
      log(COLORS.red, '   This will cause "Clerk can\'t detect clerkMiddleware" errors.');
      hasErrors = true;
    }

    // Check for problematic patterns that exclude API routes (only in actual matcher strings)
    const matcherStrings = matcherContent.match(/["'`][^"'`]*["'`]/g) || [];
    const hasProblematicPattern = matcherStrings.some(str => {
      // Only flag as problematic if it specifically excludes 'api' (not just contains (?!)
      return /\(\?\![^)]*\bapi\b[^)]*\)/.test(str);
    });
    
    if (hasProblematicPattern) {
      log(COLORS.red, '❌ CRITICAL ERROR: Matcher pattern excludes API routes with (?!api');
      hasErrors = true;
    }

    if (!hasErrors) {
      log(COLORS.green, '✅ Matcher configuration looks correct');
    }
  }

  // Check 2: Ensure clerkMiddleware is used
  if (!content.includes('clerkMiddleware')) {
    log(COLORS.red, '❌ ERROR: clerkMiddleware not found in middleware.ts');
    hasErrors = true;
  } else {
    log(COLORS.green, '✅ clerkMiddleware is being used');
  }

  // Check 3: Look for auth() usage
  if (!content.includes('auth()')) {
    log(COLORS.yellow, '⚠️  WARNING: auth() function not found in middleware');
    hasWarnings = true;
  } else {
    log(COLORS.green, '✅ auth() function is being used');
  }

  // Check 4: Ensure export default is present
  if (!content.includes('export default clerkMiddleware')) {
    log(COLORS.red, '❌ ERROR: Missing "export default clerkMiddleware"');
    hasErrors = true;
  } else {
    log(COLORS.green, '✅ Proper default export found');
  }

  // Check 5: Environment variables
  let clerkKeysFound = false;
  
  // Check if we're in Cloudflare Pages build environment
  const isCloudflarePages = process.env.CF_PAGES === '1' || process.env.CLOUDFLARE_ENV;
  
  if (isCloudflarePages) {
    log(COLORS.blue, '🔧 Cloudflare Pages environment detected');
    log(COLORS.yellow, '⚠️  Skipping environment variable validation (will be available at runtime)');
    log(COLORS.yellow, '   Make sure CLERK_SECRET_KEY is configured in Cloudflare Pages dashboard');
    clerkKeysFound = true; // Skip validation in CF Pages build
  } else {
    // First check process.env (for local development and other environments)
    if (process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY) {
      clerkKeysFound = true;
      log(COLORS.green, '✅ Clerk environment variables found in process.env');
    } else {
      // Fallback to checking local env files
      const envFiles = ['.env', '.env.local'];
      
      for (const envFile of envFiles) {
        const envPath = path.join(process.cwd(), envFile);
        if (fs.existsSync(envPath)) {
          const envContent = fs.readFileSync(envPath, 'utf8');
          if (envContent.includes('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY') && 
              envContent.includes('CLERK_SECRET_KEY')) {
            clerkKeysFound = true;
            log(COLORS.green, `✅ Clerk environment variables found in ${envFile}`);
            break;
          }
        }
      }
    }

    if (!clerkKeysFound) {
      log(COLORS.red, '❌ ERROR: Clerk environment variables not found!');
      log(COLORS.red, '   Required: NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY, CLERK_SECRET_KEY');
      hasErrors = true;
    }
  }

  // Final result
  console.log();
  if (hasErrors) {
    log(COLORS.red + COLORS.bold, '💥 CONFIGURATION VALIDATION FAILED!');
    log(COLORS.red, 'Please fix the errors above before continuing.');
    process.exit(1);
  } else if (hasWarnings) {
    log(COLORS.yellow + COLORS.bold, '⚠️  CONFIGURATION VALIDATION PASSED WITH WARNINGS');
    log(COLORS.yellow, 'Consider addressing the warnings above.');
  } else {
    log(COLORS.green + COLORS.bold, '🎉 CONFIGURATION VALIDATION PASSED!');
    log(COLORS.green, 'Your middleware configuration looks good.');
  }
}

// Test API endpoint reachability
async function testApiEndpoint() {
  try {
    const response = await fetch('http://localhost:3000/api/convert?page=1&limit=1');
    
    if (response.status === 401) {
      log(COLORS.green, '✅ API endpoint correctly returns 401 (Unauthorized)');
    } else if (response.status === 500) {
      const error = await response.json();
      if (error.details && error.details.includes('clerkMiddleware')) {
        log(COLORS.red, '❌ API endpoint has Clerk middleware error!');
        log(COLORS.red, `   Error: ${error.details}`);
        return false;
      }
    }
    return true;
  } catch (error) {
    log(COLORS.yellow, '⚠️  Could not test API endpoint (server may not be running)');
    return true;
  }
}

// Main execution
async function main() {
  validateMiddleware();
  
  // If validation passed, optionally test API
  if (process.argv.includes('--test-api')) {
    console.log();
    log(COLORS.blue, '🧪 Testing API endpoint...');
    await testApiEndpoint();
  }
}

main().catch(console.error);