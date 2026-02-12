import { Skeleton } from "@/components/ui/skeleton";
import { Navbar } from "@/components/layout/navbar";

function RoomCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-neutral-100 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-32 bg-neutral-200" />
        <Skeleton className="h-5 w-16 rounded-full bg-neutral-200" />
      </div>
      <Skeleton className="h-4 w-48 bg-neutral-100" />
      <div className="flex items-center gap-2 pt-2">
        <Skeleton className="h-6 w-6 rounded-full bg-neutral-200" />
        <Skeleton className="h-4 w-20 bg-neutral-100" />
      </div>
      <div className="flex items-center gap-4 pt-1">
        <Skeleton className="h-4 w-16 bg-neutral-100" />
        <Skeleton className="h-4 w-16 bg-neutral-100" />
      </div>
    </div>
  );
}

export default function RoomsLoading() {
  return (
    <div className="min-h-screen bg-neutral-50">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <Skeleton className="h-7 w-40 bg-neutral-200 mb-2" />
            <Skeleton className="h-4 w-56 bg-neutral-100" />
          </div>
          <Skeleton className="h-9 w-28 rounded-lg bg-neutral-200" />
        </div>

        {/* Search bar */}
        <div className="flex items-center gap-3 mb-6">
          <Skeleton className="h-9 flex-1 rounded-lg bg-neutral-200" />
          <Skeleton className="h-9 w-9 rounded-lg bg-neutral-200" />
        </div>

        {/* Room cards grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <RoomCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
