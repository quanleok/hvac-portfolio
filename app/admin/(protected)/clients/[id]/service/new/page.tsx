import { notFound } from "next/navigation";
import { AdminBreadcrumbs } from "@/components/admin/admin-breadcrumbs";
import { NewServiceForm } from "@/components/admin/new-service-form";
import { SetupNotice } from "@/components/admin/setup-notice";
import { getClientDetail } from "@/lib/admin/data";
import { isMissingClientSchemaError } from "@/lib/admin/setup";

interface NewServicePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function NewServicePage({ params }: NewServicePageProps) {
  const { id } = await params;
  let detail;

  try {
    detail = await getClientDetail(id);
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
            { label: "New service" },
          ]}
        />
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#6c8096]">
          Service log
        </p>
        <h1 className="display-heading text-2xl font-extrabold text-white">Add a service record for {detail.client.name}</h1>
      </div>

      <section className="rounded-md border border-[#25344a] bg-[#0f1c2d] p-4">
        <NewServiceForm clientId={detail.client.id} />
      </section>
    </div>
  );
}
