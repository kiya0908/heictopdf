import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { env } from "@/env.mjs";

// DEPRECATED: This webhook is temporarily disabled due to database schema changes
// The fluxData table has been removed from the database schema

export async function POST(req: Request) {
  // You can find this in the Clerk Dashboard -> Webhooks -> choose the endpoint
  const TASK_HEADER_KEY = env.TASK_HEADER_KEY;

  if (!TASK_HEADER_KEY) {
    throw new Error("Please add TASK_HEADER_KEY");
  }

  // Get the headers
  const headerPayload = headers();
  const webhookKey = headerPayload.get("next-money-webhook-key");

  // If there are no headers, error out
  if (!webhookKey || webhookKey! !== TASK_HEADER_KEY) {
    return new Response("Error occured -- no headers", {
      status: 400,
    });
  }

  // Return success but do nothing since the flux system is deprecated
  return new Response("", { status: 200 });
}
