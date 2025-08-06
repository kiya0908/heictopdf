import { NextRequest, NextResponse } from "next/server";

import { currentUser } from "@clerk/nextjs/server";

// DEPRECATED: This API route is temporarily disabled due to database schema changes
// The media table has been removed from the database schema

export async function POST(req: NextRequest) {
  const user = await currentUser();
  if (!user || !user.publicMetadata.siteOwner) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Return error since the media system is deprecated
  return NextResponse.json(
    { error: "Media upload system is currently unavailable" },
    { status: 400 },
  );
}
