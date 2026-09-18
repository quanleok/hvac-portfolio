import { AdminBreadcrumbs } from "@/components/admin/admin-breadcrumbs";
import { NewClientForm } from "@/components/admin/new-client-form";
import { SetupNotice } from "@/components/admin/setup-notice";
import { getDashboardData } from "@/lib/admin/data";
import { isMissingClientSchemaError } from "@/lib/admin/setup";

export default async function NewClientPage() {
  try {
    await getDashboardData();
  } catch (error) {
    if (isMissingClientSchemaError(error)) {
      return <SetupNotice />;
    }

    throw error;
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <AdminBreadcrumbs items={[{ label: "Clients", href: "/admin" }, { label: "New client" }]} />
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#6c8096]">
          New client
        </p>
        <h1 className="display-heading text-2xl font-extrabold text-white">Create a client record</h1>
        <p className="max-w-2xl text-base leading-6 text-[#9aafc5]">
          Name and phone are required. Everything else can be added now or later from the client
          detail page with inline edits.
        </p>
      </div>

      <section className="rounded-md border border-[#25344a] bg-[#0f1c2d] p-4">
        <NewClientForm />
      </section>
    </div>
  );
}
