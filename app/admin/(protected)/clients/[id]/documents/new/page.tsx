import { notFound } from "next/navigation";
import { AdminBreadcrumbs } from "@/components/admin/admin-breadcrumbs";
import { NewDocumentForm } from "@/components/admin/new-document-form";
import type { DocumentPresetMap } from "@/lib/admin/document-presets";
import { SetupNotice } from "@/components/admin/setup-notice";
import { getClientDetail, getDocumentPresets } from "@/lib/admin/data";
import { isMissingClientSchemaError } from "@/lib/admin/setup";
import { documentTypes, type DocumentType } from "@/lib/admin/schema";

interface NewDocumentPageProps {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    type?: string;
  }>;
}

function getDefaultType(value?: string): DocumentType {
  return documentTypes.includes(value as DocumentType) ? (value as DocumentType) : "quote";
}

export default async function NewDocumentPage({
  params,
  searchParams,
}: NewDocumentPageProps) {
  const { id } = await params;
  const query = await searchParams;
  const defaultType = getDefaultType(query.type);
  let detail;
  let presets: DocumentPresetMap = {};

  try {
    [detail, presets] = await Promise.all([getClientDetail(id), getDocumentPresets()]);
  } catch (error) {
    if (isMissingClientSchemaError(error)) {
      return <SetupNotice />;
    }

    throw error;
  }

  if (!detail) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <AdminBreadcrumbs
          items={[
            { label: "Clients", href: "/admin" },
            { label: detail.client.name, href: `/admin/clients/${detail.client.id}` },
            { label: "New document" },
          ]}
        />
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#6c8096]">
          Quotes and invoices
        </p>
        <h1 className="display-heading text-2xl font-extrabold text-white">
          Create a branded document for {detail.client.name}
        </h1>
        <p className="max-w-2xl text-base leading-6 text-[#9aafc5]">
          Start from a saved template or build from scratch, then fine-tune pricing and sharing on
          the document page.
        </p>
      </div>

      <section className="rounded-md border border-[#25344a] bg-[#0f1c2d] p-4">
        <NewDocumentForm
          clientId={detail.client.id}
          defaultType={defaultType}
          presets={presets}
        />
      </section>
    </div>
  );
}
