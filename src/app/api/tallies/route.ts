import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { listTallies, setTally } from "@/lib/db";
import { MAX_PER_HOUR, isFuture, isInRange, localNow } from "@/lib/range";

export async function GET() {
  return NextResponse.json({ tallies: listTallies() });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const date = body?.date;
  const hour = body?.hour;
  const count = body?.count;

  if (typeof date !== "string" || typeof hour !== "number" || !Number.isInteger(count)) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  if (count < 0 || count > MAX_PER_HOUR) {
    return NextResponse.json({ error: "bad_count" }, { status: 400 });
  }

  if (!isInRange(date, hour)) {
    return NextResponse.json({ error: "out_of_range" }, { status: 400 });
  }

  if (isFuture(date, hour, localNow())) {
    return NextResponse.json({ error: "in_the_future" }, { status: 400 });
  }

  setTally(date, hour, count);

  return NextResponse.json({ ok: true });
}
