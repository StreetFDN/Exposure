import { Skeleton } from "@/components/ui/skeleton";

export default function AdminLoading() {
  return (
    <div className="space-y-8 p-6">
      {/* Header skeleton */}
      <div>
        <Skeleton variant="text" width="200px" height="1.75rem" />
        <Skeleton
          variant="text"
          width="300px"
          height="1rem"
          className="mt-2"
        />
      </div>

      {/* Stat row skeleton */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} variant="rect" height="5rem" className="rounded-xl" />
        ))}
      </div>

      {/* Table skeleton */}
      <Skeleton variant="rect" height="24rem" className="rounded-xl" />
    </div>
  );
}
