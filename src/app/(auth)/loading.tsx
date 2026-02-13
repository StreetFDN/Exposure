import { Skeleton } from "@/components/ui/skeleton";

export default function AuthLoading() {
  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      {/* Header skeleton */}
      <div>
        <Skeleton variant="text" width="180px" height="1.75rem" />
        <Skeleton
          variant="text"
          width="240px"
          height="1rem"
          className="mt-2"
        />
      </div>

      {/* Stat cards skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} variant="rect" height="5rem" className="rounded-xl" />
        ))}
      </div>

      {/* Content skeleton */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-3">
          <Skeleton variant="card" height="16rem" />
          <Skeleton variant="card" height="12rem" />
        </div>
        <div className="space-y-6 lg:col-span-2">
          <Skeleton variant="card" height="14rem" />
          <Skeleton variant="card" height="10rem" />
        </div>
      </div>
    </div>
  );
}
