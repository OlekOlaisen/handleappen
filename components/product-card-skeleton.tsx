import { Skeleton } from "@/components/ui/skeleton"

export default function ProductCardSkeleton() {
  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden flex flex-col">
      <div className="relative h-48 w-full bg-white shrink-0 rounded-t-lg">
        <Skeleton className="h-full w-full rounded-bl-none rounded-br-none" />
      </div>
      <div className="p-4 flex flex-col flex-1">
        <div className="flex-1 space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1 flex-1">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
            <div className="text-right">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-3 w-24 mt-1" />
            </div>
          </div>
          <Skeleton className="h-3 w-full" />
        </div>
        <div className="mt-3">
          <Skeleton className="h-9 w-full" />
        </div>
      </div>
    </div>
  )
}

