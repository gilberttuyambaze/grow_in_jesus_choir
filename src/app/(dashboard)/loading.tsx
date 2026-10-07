export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="h-4 w-32 bg-slate-200/80 rounded-lg" />
        <div className="h-8 w-64 bg-blue-100/80 rounded-xl" />
        <div className="h-4 w-48 bg-slate-200/80 rounded-lg" />
      </div>

      {/* Hero Pulse skeleton */}
      <div className="h-52 w-full bg-blue-100/70 rounded-[1.75rem]" />

      {/* Metric Cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="h-32 card-surface" />
        <div className="h-32 card-surface" />
        <div className="h-32 card-surface" />
        <div className="h-32 card-surface" />
      </div>

      {/* Main Grid skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-72 card-surface" />
        <div className="h-72 card-surface" />
      </div>

      {/* Table skeleton */}
      <div className="h-64 card-surface" />
    </div>
  )
}
