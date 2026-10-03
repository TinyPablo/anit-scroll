import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { addTally, listTallies, removeTally } from "@/lib/db";
import { isFuture, isInRange, localNow } from "@/lib/range";

export async function GET() {
  return NextResponse.json({ tallies: listTallies() });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const date = body?.date;
  const hour = body?.hour;
  const on = body?.on;

  if (typeof date !== "string" || typeof hour !== "number" || typeof on !== "boolean") {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  if (!isInRange(date, hour)) {
    return NextResponse.json({ error: "out_of_range" }, { status: 400 });
  }

  if (isFuture(date, hour, localNow())) {
    return NextResponse.json({ error: "in_the_future" }, { status: 400 });
  }

  if (on) addTally(date, hour);
  else removeTally(date, hour);

  return NextResponse.json({ ok: true });
}
