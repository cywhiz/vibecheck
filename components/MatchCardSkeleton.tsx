export function MatchCardSkeleton() {
  return (
    <div className="bg-brand-card border border-brand-border rounded-2xl p-5 animate-pulse">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-11 h-11 rounded-full bg-brand-border" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-brand-border rounded w-3/4" />
          <div className="h-3 bg-brand-border rounded w-1/2" />
        </div>
        <div className="w-12 h-8 bg-brand-border rounded" />
      </div>
      <div className="h-1 bg-brand-border rounded mb-4" />
      <div className="space-y-2 mb-4">
        <div className="h-3 bg-brand-border rounded" />
        <div className="h-3 bg-brand-border rounded w-4/5" />
      </div>
      <div className="h-14 bg-brand-border/50 rounded-xl mb-4" />
      <div className="flex gap-2">
        <div className="flex-1 h-10 bg-brand-border rounded-xl" />
        <div className="flex-1 h-10 bg-brand-border rounded-xl" />
      </div>
    </div>
  )
}
