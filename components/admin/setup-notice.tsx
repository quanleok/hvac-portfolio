export function SetupNotice() {
  return (
    <section className="rounded-md border border-[#25344a] bg-[#0f1c2d] p-4">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#6c8096]">
        Database setup needed
      </p>
      <h2 className="display-heading mt-3 text-2xl font-bold text-white">The Supabase CRM tables are not live yet.</h2>
      <p className="mt-3 max-w-3xl text-base leading-6 text-[#9aafc5]">
        Run the SQL from <code>supabase/migrations/20260407_client_management.sql</code> in the
        Supabase SQL editor, then refresh the admin. Auth is wired up already, but the dashboard
        and client records depend on those tables.
      </p>
    </section>
  );
}
