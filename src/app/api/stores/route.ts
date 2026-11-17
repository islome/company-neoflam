import { NextResponse } from "next/server";
import { getStores } from "@/lib/stores";

/** GET /api/stores: public list of Neoflam store locations in Uzbekistan. */
export async function GET() {
  const stores = await getStores();
  return NextResponse.json({ stores });
}
