import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DocumentPrintButton } from "@/components/admin/document-print-button";
import { companyProfile } from "@/lib/admin/company-profile";
import { getPublicDocument } from "@/lib/admin/data";
import { getDocumentImagePath } from "@/lib/admin/document-utils";
import { formatCurrency, formatDate } from "@/lib/admin/format";
import { documentStatusLabels, documentTypeLabels } from "@/lib/admin/schema";

export const dynamic = "force-dynamic";

interface PublicDocumentPageProps {
  params: Promise<{
    token: string;
  }>;
}

export async function generateMetadata({ params }: PublicDocumentPageProps): Promise<Metadata> {
  const { token } = await params;
  const detail = await getPublicDocument(token, { markViewed: false });

  if (!detail) {
    return {
      title: "Document not found | Double Le HVAC",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const { client, document } = detail;
  const title = document.title || `${documentTypeLabels[document.document_type]} for ${client.name}`;
  const description =
    document.summary || `Secure ${documentTypeLabels[document.document_type].toLowerCase()} from Double Le HVAC.`;
  const imagePath = getDocumentImagePath(token);
  const absoluteImageUrl = `${companyProfile.website}${imagePath}`;
  const absoluteDocumentUrl = `${companyProfile.website}/d/${token}`;

  return {
    metadataBase: new URL(companyProfile.website),
    title,
    description,
    robots: {
      index: false,
      follow: false,
      googleBot: {
        index: false,
        follow: false,
      },
    },
    openGraph: {
      title,
      description,
      url: absoluteDocumentUrl,
      type: "article",
      images: [
        {
          url: absoluteImageUrl,
          width: 1200,
          height: 1600,
          alt: `${document.document_number} from Double Le HVAC`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [absoluteImageUrl],
    },
  };
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-[rgba(18,23,31,0.08)] py-2 last:border-b-0">
      <span className="text-sm font-semibold uppercase tracking-[0.12em] text-[#6c8096]">
        {label}
      </span>
      <span className="text-sm font-semibold text-[#122136]">{value}</span>
    </div>
  );
}

export default async function PublicDocumentPage({ params }: PublicDocumentPageProps) {
  const { token } = await params;
  const detail = await getPublicDocument(token);

  if (!detail) {
    notFound();
  }

  const { client, document, items } = detail;
  const deadlineLabel = document.document_type === "quote" ? "Valid through" : "Due date";
  const deadlineValue = document.document_type === "quote" ? document.expires_on : document.due_date;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#16304a_0%,#0b1220_45%,#060b13_100%)] px-4 py-6 text-[#122136] sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-6xl justify-end pb-4 print:hidden">
        <div className="flex flex-wrap gap-2">
          <DocumentPrintButton />
          <Link href={getDocumentImagePath(token)} target="_blank" className="admin-secondary-button">
            Open image
          </Link>
          <Link href={companyProfile.website} className="admin-secondary-button">
            Visit website
          </Link>
        </div>
      </div>

      <main className="mx-auto w-full max-w-6xl rounded-[2rem] border border-[rgba(255,255,255,0.08)] bg-[#f6f1e6] shadow-[0_30px_90px_rgba(0,0,0,0.35)] print:rounded-none print:border-0 print:shadow-none">
        <section className="relative overflow-hidden rounded-t-[2rem] border-b border-[rgba(18,23,31,0.08)] bg-[linear-gradient(135deg,#10233b_0%,#0f1825_58%,#1d3e5a_100%)] px-6 py-8 text-white sm:px-8">
          <div className="absolute inset-y-0 right-0 hidden w-[38%] bg-[radial-gradient(circle_at_top_right,rgba(240,122,51,0.28),transparent_55%)] sm:block" />
          <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1fr)_260px] lg:items-end">
            <div className="space-y-4">
              <div className="relative h-11 w-[180px]">
                <Image
                  src="/media/generated/wordmark-clean.png"
                  alt="Double Le HVAC"
                  fill
                  className="object-contain object-left"
                  sizes="180px"
                  priority
                />
              </div>
              <div className="space-y-2">
                <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-[#9fd2ff]">
                  {documentTypeLabels[document.document_type]}
                </p>
                <h1 className="display-heading text-3xl font-extrabold sm:text-4xl">
                  {document.title || `${documentTypeLabels[document.document_type]} for ${client.name}`}
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-[rgba(236,242,247,0.86)] sm:text-base">
                  {document.summary ||
                    "Prepared by Double Le HVAC for review, approval, and scheduling."}
                </p>
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-[rgba(255,255,255,0.14)] bg-[rgba(4,10,18,0.22)] p-4 backdrop-blur-sm">
              <DetailRow label="Number" value={document.document_number} />
              <DetailRow label="Issued" value={formatDate(document.issue_date)} />
              <DetailRow label={deadlineLabel} value={formatDate(deadlineValue)} />
              <DetailRow label="Status" value={documentStatusLabels[document.status]} />
            </div>
          </div>
        </section>

        <section className="grid gap-8 px-6 py-8 sm:px-8 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-8">
            <section className="grid gap-6 md:grid-cols-2">
              <div className="space-y-3">
                <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#6c8096]">
                  Prepared by
                </p>
                <div className="space-y-1 text-sm leading-6 text-[#24354a]">
                  <p className="text-base font-bold text-[#122136]">{companyProfile.name}</p>
                  <p>{companyProfile.cityStateZip}</p>
                  <a href={companyProfile.phoneHref} className="font-semibold text-[#102f4b] underline-offset-4 hover:underline">
                    {companyProfile.phoneDisplay}
                  </a>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#6c8096]">
                  Prepared for
                </p>
                <div className="space-y-1 text-sm leading-6 text-[#24354a]">
                  <p className="text-base font-bold text-[#122136]">{client.name}</p>
                  <p>{client.phone}</p>
                  {client.email ? <p>{client.email}</p> : null}
                  {client.address ? <p>{client.address}</p> : null}
                  {client.city || client.zip ? <p>{[client.city, client.zip].filter(Boolean).join(", ")}</p> : null}
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="display-heading text-2xl font-bold text-[#122136]">Line items</h2>
                <span className="rounded-full border border-[rgba(18,23,31,0.14)] bg-white px-3 py-1 text-xs font-extrabold uppercase tracking-[0.16em] text-[#3a4b5f]">
                  {items.length} item{items.length === 1 ? "" : "s"}
                </span>
              </div>

              <div className="overflow-hidden rounded-[1.5rem] border border-[rgba(18,23,31,0.08)] bg-white">
                <div className="hidden grid-cols-[minmax(0,1fr)_120px_160px_160px] gap-4 border-b border-[rgba(18,23,31,0.08)] bg-[#eef3f8] px-5 py-4 text-xs font-extrabold uppercase tracking-[0.16em] text-[#5d7084] sm:grid">
                  <span>Description</span>
                  <span>Qty</span>
                  <span>Unit price</span>
                  <span>Line total</span>
                </div>

                {items.length === 0 ? (
                  <div className="px-5 py-6 text-sm text-[#5d7084]">
                    No line items were added to this document yet.
                  </div>
                ) : (
                  <div>
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="grid gap-3 border-b border-[rgba(18,23,31,0.08)] px-5 py-4 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_120px_160px_160px] sm:items-start"
                      >
                        <div>
                          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#6c8096] sm:hidden">
                            Description
                          </p>
                          <p className="mt-1 text-base font-semibold text-[#122136]">{item.description}</p>
                        </div>
                        <div>
                          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#6c8096] sm:hidden">
                            Qty
                          </p>
                          <p className="mt-1 text-base font-semibold text-[#122136]">{item.quantity}</p>
                        </div>
                        <div>
                          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#6c8096] sm:hidden">
                            Unit price
                          </p>
                          <p className="mt-1 text-base font-semibold text-[#122136]">{formatCurrency(item.unit_price)}</p>
                        </div>
                        <div>
                          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#6c8096] sm:hidden">
                            Line total
                          </p>
                          <p className="mt-1 text-base font-semibold text-[#122136]">{formatCurrency(item.line_total)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            {document.notes ? (
              <section className="space-y-3">
                <h2 className="display-heading text-2xl font-bold text-[#122136]">Notes</h2>
                <div className="whitespace-pre-wrap rounded-[1.5rem] border border-[rgba(18,23,31,0.08)] bg-white px-5 py-4 text-sm leading-7 text-[#24354a]">
                  {document.notes}
                </div>
              </section>
            ) : null}

            {document.terms ? (
              <section className="space-y-3">
                <h2 className="display-heading text-2xl font-bold text-[#122136]">Terms</h2>
                <div className="whitespace-pre-wrap rounded-[1.5rem] border border-[rgba(18,23,31,0.08)] bg-white px-5 py-4 text-sm leading-7 text-[#24354a]">
                  {document.terms}
                </div>
              </section>
            ) : null}
          </div>

          <aside className="space-y-5">
            <section className="rounded-[1.5rem] border border-[rgba(18,23,31,0.08)] bg-white p-5">
              <h2 className="display-heading text-2xl font-bold text-[#122136]">Summary</h2>
              <div className="mt-4 space-y-3 text-sm text-[#24354a]">
                <DetailRow label="Subtotal" value={formatCurrency(document.subtotal)} />
                <DetailRow label="Tax" value={formatCurrency(document.tax_amount)} />
                <DetailRow label="Discount" value={formatCurrency(document.discount_amount)} />
                <DetailRow label="Deposit" value={formatCurrency(document.deposit_amount)} />
              </div>
              <div className="mt-4 rounded-[1.25rem] bg-[#10233b] px-4 py-4 text-white">
                <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#9fd2ff]">
                  Total
                </p>
                <p className="mt-2 text-3xl font-extrabold">{formatCurrency(document.total)}</p>
                <p className="mt-2 text-sm text-[rgba(236,242,247,0.84)]">
                  Balance due {formatCurrency(document.balance_due)}
                </p>
              </div>
            </section>

            <section className="rounded-[1.5rem] border border-[rgba(18,23,31,0.08)] bg-white p-5">
              <h2 className="display-heading text-2xl font-bold text-[#122136]">Contact</h2>
              <div className="mt-4 space-y-2 text-sm leading-6 text-[#24354a]">
                <p>If you have a question about this document, contact Double Le HVAC directly.</p>
                <a href={companyProfile.phoneHref} className="block font-semibold text-[#102f4b] underline-offset-4 hover:underline">
                  {companyProfile.phoneDisplay}
                </a>
                <a href={companyProfile.website} className="block font-semibold text-[#102f4b] underline-offset-4 hover:underline">
                  {companyProfile.website.replace("https://", "")}
                </a>
              </div>
            </section>
          </aside>
        </section>
      </main>
    </div>
  );
}
