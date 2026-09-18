import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { companyProfile } from "@/lib/admin/company-profile";
import { getPublicDocument } from "@/lib/admin/data";
import { formatCurrency, formatDate } from "@/lib/admin/format";
import { documentStatusLabels, documentTypeLabels } from "@/lib/admin/schema";

export const runtime = "nodejs";
export const contentType = "image/png";
export const size = {
  width: 1200,
  height: 1600,
};

const wordmarkPath = path.join(process.cwd(), "public/media/generated/wordmark-clean.png");
const wordmarkDataUrlPromise = readFile(wordmarkPath).then(
  (buffer) => `data:image/png;base64,${buffer.toString("base64")}`
);

function truncate(value: string | null | undefined, maxLength: number) {
  if (!value) return "";
  return value.length > maxLength ? `${value.slice(0, maxLength - 1)}…` : value;
}

interface DocumentImageRouteProps {
  params: Promise<{
    token: string;
  }>;
}

export async function GET(_request: Request, { params }: DocumentImageRouteProps) {
  const { token } = await params;
  const detail = await getPublicDocument(token, { markViewed: false });

  if (!detail) {
    return new Response("Not found", { status: 404 });
  }

  const wordmarkDataUrl = await wordmarkDataUrlPromise;
  const { client, document, items } = detail;
  const deadlineLabel = document.document_type === "quote" ? "Valid through" : "Due date";
  const deadlineValue = document.document_type === "quote" ? document.expires_on : document.due_date;
  const previewItems = items.slice(0, 5);

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          background: "#f6f1e6",
          color: "#122136",
          fontFamily: "system-ui, sans-serif",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            display: "flex",
            padding: "72px 72px 56px",
            background: "linear-gradient(135deg, #10233b 0%, #0f1825 58%, #1d3e5a 100%)",
            color: "white",
            justifyContent: "space-between",
            gap: "40px",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
            <img
              src={wordmarkDataUrl}
              alt="Double Le HVAC"
              style={{ width: "320px", height: "64px", objectFit: "contain", objectPosition: "left" }}
            />
            <div
              style={{
                display: "flex",
                marginTop: "28px",
                fontSize: "20px",
                letterSpacing: "0.28em",
                textTransform: "uppercase",
                color: "#9fd2ff",
                fontWeight: 800,
              }}
            >
              {documentTypeLabels[document.document_type]}
            </div>
            <div
              style={{
                display: "flex",
                marginTop: "18px",
                fontSize: "64px",
                fontWeight: 800,
                lineHeight: 1.05,
                maxWidth: "620px",
              }}
            >
              {truncate(
                document.title || `${documentTypeLabels[document.document_type]} for ${client.name}`,
                72
              )}
            </div>
            <div
              style={{
                display: "flex",
                marginTop: "20px",
                maxWidth: "620px",
                fontSize: "28px",
                lineHeight: 1.4,
                color: "rgba(236,242,247,0.82)",
              }}
            >
              {truncate(
                document.summary || "Prepared by Double Le HVAC for review, approval, and scheduling.",
                160
              )}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              width: "320px",
              borderRadius: "28px",
              border: "1px solid rgba(255,255,255,0.14)",
              background: "rgba(4,10,18,0.22)",
              padding: "28px",
              gap: "18px",
            }}
          >
            {[
              ["Number", document.document_number],
              ["Issued", formatDate(document.issue_date)],
              [deadlineLabel, formatDate(deadlineValue)],
              ["Status", documentStatusLabels[document.status]],
            ].map(([label, value]) => (
              <div
                key={label}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  paddingBottom: "16px",
                  borderBottom: "1px solid rgba(255,255,255,0.1)",
                  gap: "8px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    fontSize: "16px",
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    color: "#9fd2ff",
                    fontWeight: 800,
                  }}
                >
                  {label}
                </div>
                <div style={{ display: "flex", fontSize: "28px", fontWeight: 700 }}>{value}</div>
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flex: 1,
            padding: "56px 72px 72px",
            gap: "40px",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: "28px" }}>
            <div style={{ display: "flex", gap: "24px" }}>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  flex: 1,
                  background: "white",
                  border: "1px solid rgba(18,23,31,0.08)",
                  borderRadius: "28px",
                  padding: "28px",
                  gap: "14px",
                }}
              >
                <div style={{ display: "flex", fontSize: "16px", letterSpacing: "0.18em", textTransform: "uppercase", color: "#6c8096", fontWeight: 800 }}>
                  Prepared by
                </div>
                <div style={{ display: "flex", flexDirection: "column", fontSize: "22px", lineHeight: 1.45, color: "#24354a" }}>
                  <div style={{ display: "flex", fontSize: "26px", fontWeight: 800, color: "#122136" }}>{companyProfile.name}</div>
                  <div style={{ display: "flex" }}>{companyProfile.cityStateZip}</div>
                  <div style={{ display: "flex", fontWeight: 700, color: "#102f4b" }}>{companyProfile.phoneDisplay}</div>
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  flex: 1,
                  background: "white",
                  border: "1px solid rgba(18,23,31,0.08)",
                  borderRadius: "28px",
                  padding: "28px",
                  gap: "14px",
                }}
              >
                <div style={{ display: "flex", fontSize: "16px", letterSpacing: "0.18em", textTransform: "uppercase", color: "#6c8096", fontWeight: 800 }}>
                  Prepared for
                </div>
                <div style={{ display: "flex", flexDirection: "column", fontSize: "22px", lineHeight: 1.45, color: "#24354a" }}>
                  <div style={{ display: "flex", fontSize: "26px", fontWeight: 800, color: "#122136" }}>{client.name}</div>
                  <div style={{ display: "flex" }}>{client.phone}</div>
                  {client.email ? <div style={{ display: "flex" }}>{client.email}</div> : null}
                  {client.address ? <div style={{ display: "flex" }}>{client.address}</div> : null}
                  {client.city || client.zip ? (
                    <div style={{ display: "flex" }}>{[client.city, client.zip].filter(Boolean).join(", ")}</div>
                  ) : null}
                </div>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                background: "white",
                border: "1px solid rgba(18,23,31,0.08)",
                borderRadius: "28px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "24px 28px",
                  background: "#eef3f8",
                  borderBottom: "1px solid rgba(18,23,31,0.08)",
                }}
              >
                <div style={{ display: "flex", fontSize: "16px", letterSpacing: "0.18em", textTransform: "uppercase", color: "#5d7084", fontWeight: 800 }}>
                  Line items
                </div>
                <div style={{ display: "flex", fontSize: "18px", color: "#3a4b5f", fontWeight: 700 }}>
                  {items.length} item{items.length === 1 ? "" : "s"}
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column" }}>
                {previewItems.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "20px",
                      padding: "22px 28px",
                      borderBottom: "1px solid rgba(18,23,31,0.08)",
                    }}
                  >
                    <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: "8px" }}>
                      <div style={{ display: "flex", fontSize: "24px", fontWeight: 700, color: "#122136" }}>
                        {truncate(item.description, 58)}
                      </div>
                      <div style={{ display: "flex", fontSize: "18px", color: "#6c8096" }}>
                        Qty {item.quantity} · {formatCurrency(item.unit_price)} each
                      </div>
                    </div>
                    <div style={{ display: "flex", fontSize: "26px", fontWeight: 800, color: "#122136" }}>
                      {formatCurrency(item.line_total)}
                    </div>
                  </div>
                ))}

                {items.length > previewItems.length ? (
                  <div style={{ display: "flex", padding: "22px 28px", fontSize: "18px", color: "#6c8096" }}>
                    +{items.length - previewItems.length} more item{items.length - previewItems.length === 1 ? "" : "s"}
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", width: "340px", gap: "24px" }}>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                background: "#10233b",
                color: "white",
                borderRadius: "28px",
                padding: "28px",
                gap: "18px",
              }}
            >
              <div style={{ display: "flex", fontSize: "16px", letterSpacing: "0.18em", textTransform: "uppercase", color: "#9fd2ff", fontWeight: 800 }}>
                Summary
              </div>
              {[
                ["Subtotal", formatCurrency(document.subtotal)],
                ["Tax", formatCurrency(document.tax_amount)],
                ["Discount", formatCurrency(document.discount_amount)],
                ["Deposit", formatCurrency(document.deposit_amount)],
              ].map(([label, value]) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: "22px", color: "rgba(236,242,247,0.88)" }}>
                  <div style={{ display: "flex" }}>{label}</div>
                  <div style={{ display: "flex", fontWeight: 700 }}>{value}</div>
                </div>
              ))}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  borderTop: "1px solid rgba(255,255,255,0.12)",
                  paddingTop: "18px",
                  gap: "10px",
                }}
              >
                <div style={{ display: "flex", fontSize: "16px", letterSpacing: "0.18em", textTransform: "uppercase", color: "#9fd2ff", fontWeight: 800 }}>
                  Total
                </div>
                <div style={{ display: "flex", fontSize: "44px", fontWeight: 900 }}>{formatCurrency(document.total)}</div>
                <div style={{ display: "flex", fontSize: "22px", color: "rgba(236,242,247,0.84)" }}>
                  Balance due {formatCurrency(document.balance_due)}
                </div>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                background: "white",
                border: "1px solid rgba(18,23,31,0.08)",
                borderRadius: "28px",
                padding: "28px",
                gap: "16px",
              }}
            >
              <div style={{ display: "flex", fontSize: "16px", letterSpacing: "0.18em", textTransform: "uppercase", color: "#6c8096", fontWeight: 800 }}>
                Contact
              </div>
              <div style={{ display: "flex", fontSize: "22px", lineHeight: 1.45, color: "#24354a" }}>
                Questions about this document? Contact Double Le HVAC directly.
              </div>
              <div style={{ display: "flex", fontSize: "24px", fontWeight: 800, color: "#102f4b" }}>{companyProfile.phoneDisplay}</div>
              <div style={{ display: "flex", fontSize: "22px", color: "#102f4b" }}>{companyProfile.website.replace("https://", "")}</div>
            </div>

            {(document.notes || document.terms) ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  background: "white",
                  border: "1px solid rgba(18,23,31,0.08)",
                  borderRadius: "28px",
                  padding: "28px",
                  gap: "16px",
                }}
              >
                {document.notes ? (
                  <>
                    <div style={{ display: "flex", fontSize: "16px", letterSpacing: "0.18em", textTransform: "uppercase", color: "#6c8096", fontWeight: 800 }}>
                      Notes
                    </div>
                    <div style={{ display: "flex", fontSize: "20px", lineHeight: 1.45, color: "#24354a" }}>
                      {truncate(document.notes, 180)}
                    </div>
                  </>
                ) : null}
                {document.terms ? (
                  <>
                    <div style={{ display: "flex", fontSize: "16px", letterSpacing: "0.18em", textTransform: "uppercase", color: "#6c8096", fontWeight: 800 }}>
                      Terms
                    </div>
                    <div style={{ display: "flex", fontSize: "20px", lineHeight: 1.45, color: "#24354a" }}>
                      {truncate(document.terms, 180)}
                    </div>
                  </>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    ),
    size
  );
}
