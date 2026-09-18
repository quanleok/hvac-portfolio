import { AdminBreadcrumbs } from "@/components/admin/admin-breadcrumbs";
import { ChangePasswordForm } from "@/components/admin/change-password-form";

export default function AdminAccountPage() {
  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <AdminBreadcrumbs items={[{ label: "Clients", href: "/admin" }, { label: "Settings" }]} />
        <h1 className="display-heading text-2xl font-extrabold text-white">Settings</h1>
      </section>

      <section className="rounded-md border border-[#25344a] bg-[#0f1c2d] max-w-xl p-4">
        <h2 className="mb-4 text-base font-bold text-white">Change password</h2>
        <ChangePasswordForm />
      </section>
    </div>
  );
}
