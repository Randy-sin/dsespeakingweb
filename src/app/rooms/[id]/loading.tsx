import { Skeleton } from "@/components/ui/skeleton";
import { Navbar } from "@/components/layout/navbar";

function MemberSkeleton() {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-neutral-50">
      <Skeleton className="h-9 w-9 rounded-full bg-neutral-200" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-4 w-24 bg-neutral-200" />
        <Skeleton className="h-3 w-16 bg-neutral-100" />
      </div>
      <Skeleton className="h-5 w-5 rounded-full bg-neutral-200" />
    </div>
  );
}

export default function WaitingRoomLoading() {
  return (
    <div className="min-h-screen bg-neutral-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Back button */}
        <Skeleton className="h-8 w-24 rounded-lg bg-neutral-200 mb-6" />

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left: Room info */}
          <div className="lg:col-span-2 space-y-4">
            {/* Room header card */}
            <div className="bg-white rounded-xl border border-neutral-100 p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-6 w-48 bg-neutral-200" />
                  <Skeleton className="h-4 w-32 bg-neutral-100" />
                </div>
                <Skeleton className="h-6 w-20 rounded-full bg-neutral-200" />
              </div>

              {/* Paper info */}
              <div className="pt-2 space-y-2">
                <Skeleton className="h-4 w-full bg-neutral-100" />
                <Skeleton className="h-4 w-3/4 bg-neutral-100" />
              </div>
            </div>

            {/* Paper preview card */}
            <div className="bg-white rounded-xl border border-neutral-100 p-5 space-y-3">
              <Skeleton className="h-5 w-32 bg-neutral-200" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full bg-neutral-100" />
                <Skeleton className="h-4 w-full bg-neutral-100" />
                <Skeleton className="h-4 w-2/3 bg-neutral-100" />
              </div>
            </div>
          </div>

          {/* Right: Members panel */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-neutral-100 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-24 bg-neutral-200" />
                <Skeleton className="h-5 w-12 bg-neutral-100" />
              </div>

              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <MemberSkeleton key={i} />
                ))}
              </div>
            </div>

            {/* Action buttons */}
            <div className="space-y-2">
              <Skeleton className="h-10 w-full rounded-lg bg-neutral-200" />
              <Skeleton className="h-10 w-full rounded-lg bg-neutral-100" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
