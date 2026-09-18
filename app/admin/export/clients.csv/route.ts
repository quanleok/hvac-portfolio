import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin/auth";
import { getAdminTodayDateString } from "@/lib/admin/date";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes("\"") || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, "\"\"")}"`;
  }
  return str;
}

export async function GET(request: NextRequest) {
  const session = await getAdminSession();

  if (!session) {
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("next", "/admin/export/clients.csv");
    return NextResponse.redirect(loginUrl);
  }

  try {
    const supabase = createSupabaseAdminClient();

    const { data: clients, error } = await supabase
      .from("clients")
      .select("name, phone, email, address, city, zip, status, source, created_at")
      .order("created_at", { ascending: false });

    if (error) throw error;

    const headers = [
      "Name",
      "Phone",
      "Email",
      "Address",
      "City",
      "ZIP",
      "Status",
      "Source",
      "Created",
    ];

    const rows = (clients ?? []).map((c) =>
      [
        c.name,
        c.phone,
        c.email ?? "",
        c.address ?? "",
        c.city ?? "",
        c.zip ?? "",
        c.status,
        c.source,
        c.created_at,
      ]
        .map(csvEscape)
        .join(",")
    );

    const csv = [headers.join(","), ...rows].join("\n") + "\n";
    const filename = `double-le-clients-${getAdminTodayDateString()}.csv`;

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Type": "text/csv; charset=utf-8",
      },
    });
  } catch (error) {
    console.error("[admin/export/clients.csv] failed:", error);
    const message = error instanceof Error ? error.message : "Unable to export clients.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
