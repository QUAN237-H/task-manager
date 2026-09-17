import { cn } from '@/lib/utils'

function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-foreground/8', className)}
      {...props}
    />
  )
}

function Spinner({ className, size = 16 }: { className?: string; size?: number }) {
  return (
    <span
      className={cn(
        'inline-block shrink-0 animate-spin rounded-full border-2 border-foreground/20 border-t-foreground',
        className,
      )}
      style={{ width: size, height: size }}
      aria-hidden
    />
  )
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-4 lg:min-h-0 lg:flex-1">
      <div className="grid shrink-0 grid-cols-2 gap-2 lg:grid-cols-3 lg:gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'rounded-xl bg-secondary/60 p-3 sm:p-4',
              i === 2 && 'col-span-2 lg:col-span-1',
            )}
          >
            <Skeleton className="h-3 w-16" />
            <Skeleton className="mt-3 h-7 w-12" />
            <Skeleton className="mt-2 h-3 w-24" />
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 lg:hidden">
        <div className="flex gap-2">
          <Skeleton className="h-10 flex-1 rounded-xl" />
          <Skeleton className="h-10 w-28 rounded-xl" />
        </div>
        <Skeleton className="h-9 w-full rounded-xl" />
        {Array.from({ length: 2 }).map((_, card) => (
          <div
            key={card}
            className="flex h-[168px] flex-col rounded-2xl border border-border/80 bg-card p-4"
          >
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="mt-3 h-4 w-[80%]" />
            <Skeleton className="mt-2 h-3 w-full" />
            <div className="mt-auto flex items-center justify-between pt-3">
              <Skeleton className="h-3 w-10" />
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>
          </div>
        ))}
      </div>

      <div className="hidden min-h-0 flex-1 grid-cols-3 gap-4 lg:grid">
        {Array.from({ length: 3 }).map((_, col) => (
          <div key={col} className="flex flex-col gap-2.5">
            <Skeleton className="h-8 w-28 rounded-full" />
            <Skeleton className="h-8 w-full rounded-xl" />
            <Skeleton className="h-[168px] w-full rounded-2xl" />
          </div>
        ))}
      </div>
    </div>
  )
}

export { Skeleton, Spinner, DashboardSkeleton }
