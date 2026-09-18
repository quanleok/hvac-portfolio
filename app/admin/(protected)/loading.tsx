function LoadingPill() {
  return <div className="h-11 w-28 animate-pulse rounded-full bg-[#162334]" />;
}

function LoadingPanel({ height }: { height: string }) {
  return (
    <div className="rounded-[1.6rem] border border-[#203246] bg-[#0d1827] p-5">
      <div className="h-4 w-40 animate-pulse rounded bg-[#182638]" />
      <div className="mt-4 h-3 w-80 max-w-full animate-pulse rounded bg-[#142133]" />
      <div className={`mt-6 w-full animate-pulse rounded-[1.1rem] bg-[#101d2d] ${height}`} />
    </div>
  );
}

export default function AdminProtectedLoading() {
  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <div className="h-5 w-36 animate-pulse rounded bg-[#182638]" />
        <div className="h-11 w-72 max-w-full animate-pulse rounded-2xl bg-[#101d2d]" />
        <div className="flex flex-wrap gap-2">
          <LoadingPill />
          <LoadingPill />
          <LoadingPill />
          <LoadingPill />
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        <LoadingPanel height="h-56" />
        <LoadingPanel height="h-56" />
      </div>

      <LoadingPanel height="h-72" />
    </div>
  );
}
