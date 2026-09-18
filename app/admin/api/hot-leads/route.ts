import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin/auth";
import { getHotLeadCount } from "@/lib/admin/data";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const count = await getHotLeadCount();
  return NextResponse.json(
    { count },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}
