import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin/auth";
import { getAdminTodayDateString } from "@/lib/admin/date";
import { getAdminBackupData } from "@/lib/admin/export";

function buildBackupFilename() {
  const stamp = getAdminTodayDateString();
  return `double-le-hvac-backup-${stamp}.json`;
}

export async function GET(request: NextRequest) {
  const session = await getAdminSession();

  if (!session) {
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("next", "/admin/export");
    return NextResponse.redirect(loginUrl);
  }

  try {
    const backup = await getAdminBackupData();

    return new NextResponse(JSON.stringify(backup, null, 2), {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
        "Content-Disposition": `attachment; filename="${buildBackupFilename()}"`,
        "Content-Type": "application/json; charset=utf-8",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to export data.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
