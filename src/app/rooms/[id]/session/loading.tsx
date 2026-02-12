import { Skeleton } from "@/components/ui/skeleton";

function VideoTileSkeleton() {
  return (
    <div className="aspect-video bg-neutral-800 rounded-lg overflow-hidden relative">
      <Skeleton className="absolute inset-0 bg-neutral-700" />
      <div className="absolute bottom-2 left-2 flex items-center gap-2">
        <Skeleton className="h-6 w-6 rounded-full bg-neutral-600" />
        <Skeleton className="h-4 w-20 bg-neutral-600" />
      </div>
    </div>
  );
}

function SidebarSkeleton() {
  return (
    <div className="w-72 bg-neutral-900 border-l border-neutral-800 p-4 space-y-4">
      {/* Phase indicator */}
      <div className="space-y-2">
        <Skeleton className="h-5 w-32 bg-neutral-700" />
        <Skeleton className="h-3 w-full bg-neutral-800" />
      </div>

      {/* Timer */}
      <div className="bg-neutral-800 rounded-lg p-4 space-y-2">
        <Skeleton className="h-8 w-24 mx-auto bg-neutral-700" />
        <Skeleton className="h-3 w-20 mx-auto bg-neutral-700" />
      </div>

      {/* Members list */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-20 bg-neutral-700" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2 p-2">
            <Skeleton className="h-8 w-8 rounded-full bg-neutral-700" />
            <Skeleton className="h-4 w-24 bg-neutral-700" />
          </div>
        ))}
      </div>

      {/* Action button */}
      <Skeleton className="h-10 w-full rounded-lg bg-neutral-700" />
    </div>
  );
}

export default function SessionLoading() {
  return (
    <div className="min-h-screen bg-neutral-950 flex">
      {/* Main video area */}
      <div className="flex-1 p-4 flex flex-col">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-lg bg-neutral-800" />
            <Skeleton className="h-5 w-40 bg-neutral-800" />
          </div>
          <Skeleton className="h-8 w-24 rounded-lg bg-neutral-800" />
        </div>

        {/* Video grid */}
        <div className="flex-1 grid grid-cols-2 gap-3 max-w-4xl mx-auto w-full">
          {Array.from({ length: 4 }).map((_, i) => (
            <VideoTileSkeleton key={i} />
          ))}
        </div>

        {/* Bottom controls */}
        <div className="flex items-center justify-center gap-3 mt-4 py-3">
          <Skeleton className="h-12 w-12 rounded-full bg-neutral-800" />
          <Skeleton className="h-12 w-12 rounded-full bg-neutral-800" />
          <Skeleton className="h-12 w-12 rounded-full bg-neutral-800" />
          <Skeleton className="h-12 w-12 rounded-full bg-red-900/50" />
        </div>
      </div>

      {/* Sidebar */}
      <SidebarSkeleton />
    </div>
  );
}
