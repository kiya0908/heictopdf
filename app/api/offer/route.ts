import { NextResponse, type NextRequest } from "next/server";

import { auth, currentUser } from "@clerk/nextjs/server";

// DEPRECATED: This API route is temporarily disabled due to database schema changes
// The claimedActivityOrder table has been removed from the database schema

export async function GET() {
  const { userId } = auth();

  const user = await currentUser();
  if (!userId || !user || !user.primaryEmailAddress) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Return no offers available since the activity system is deprecated
  return NextResponse.json(
    { error: "No offers available", code: 1000401 },
    { status: 400 },
  );
}

export async function POST(req: NextRequest) {
  const { userId } = auth();

  const user = await currentUser();
  if (!userId || !user || !user.primaryEmailAddress) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Return error since the activity system is deprecated
  return NextResponse.json(
    { error: "Activity system is currently unavailable" },
    { status: 400 },
  );
}
