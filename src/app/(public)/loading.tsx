import { Skeleton } from "@/components/ui/skeleton";

export default function PublicLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      {/* Page title skeleton */}
      <div className="mb-8">
        <Skeleton variant="text" width="200px" height="2rem" />
        <Skeleton
          variant="text"
          width="320px"
          height="1rem"
          className="mt-2"
        />
      </div>

      {/* Filter bar skeleton */}
      <Skeleton variant="rect" height="4rem" className="mb-8 rounded-xl" />

      {/* Card grid skeleton */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} variant="card" />
        ))}
      </div>
    </div>
  );
}
