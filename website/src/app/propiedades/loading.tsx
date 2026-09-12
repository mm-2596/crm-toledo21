export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-6 pb-14 pt-28">
      <div className="h-3 w-24 animate-pulse rounded bg-paper-dim" />
      <div className="mt-3 h-9 w-72 animate-pulse rounded bg-paper-dim" />
      <div className="mt-3 h-4 w-40 animate-pulse rounded bg-paper-dim" />

      <div className="mt-8 h-24 animate-pulse rounded-2xl bg-paper-dim" />

      <div className="mt-10 grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i}>
            <div className="aspect-[4/3] animate-pulse rounded-2xl bg-paper-dim" />
            <div className="mt-4 h-5 w-3/4 animate-pulse rounded bg-paper-dim" />
            <div className="mt-2 h-4 w-1/2 animate-pulse rounded bg-paper-dim" />
            <div className="mt-3 h-5 w-1/3 animate-pulse rounded bg-paper-dim" />
          </div>
        ))}
      </div>
    </div>
  );
}
