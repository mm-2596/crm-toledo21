export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-6 pb-12 pt-28">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="h-3 w-32 animate-pulse rounded bg-paper-dim" />
          <div className="mt-3 h-8 w-80 animate-pulse rounded bg-paper-dim" />
          <div className="mt-3 h-4 w-48 animate-pulse rounded bg-paper-dim" />
        </div>
        <div className="h-9 w-36 animate-pulse rounded bg-paper-dim" />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-12 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="aspect-[16/10] w-full animate-pulse rounded-2xl bg-paper-dim" />
          <div className="mt-8 h-16 animate-pulse rounded-xl bg-paper-dim" />
          <div className="mt-8 h-24 animate-pulse rounded-xl bg-paper-dim" />
        </div>
        <div className="h-64 animate-pulse rounded-2xl bg-paper-dim" />
      </div>
    </div>
  );
}
