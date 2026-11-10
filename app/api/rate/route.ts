import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { CURRENCY_CODES } from "@/lib/constants";
import { isIsoDate } from "@/lib/format";
import { fetchRate } from "@/lib/rates";

export async function GET(request: NextRequest) {
  const currency = request.nextUrl.searchParams.get("currency") ?? "";
  const date = request.nextUrl.searchParams.get("date") ?? "";
  if (!CURRENCY_CODES.includes(currency) || !isIsoDate(date)) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
  return NextResponse.json({ rate: await fetchRate(currency, date) });
}
