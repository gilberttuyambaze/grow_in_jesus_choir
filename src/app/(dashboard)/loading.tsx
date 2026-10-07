export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="h-4 w-32 bg-[#e2ebe4] rounded-lg" />
        <div className="h-8 w-64 bg-[#dbe5dd] rounded-xl" />
        <div className="h-4 w-48 bg-[#e2ebe4] rounded-lg" />
      </div>

      {/* Hero Pulse skeleton */}
      <div className="h-52 w-full bg-[#d7e5dc] rounded-3xl" />

      {/* Metric Cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="h-32 bg-white rounded-2xl border border-[#e2ebe4]" />
        <div className="h-32 bg-white rounded-2xl border border-[#e2ebe4]" />
        <div className="h-32 bg-white rounded-2xl border border-[#e2ebe4]" />
        <div className="h-32 bg-white rounded-2xl border border-[#e2ebe4]" />
      </div>

      {/* Main Grid skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-72 bg-white rounded-2xl border border-[#e2ebe4]" />
        <div className="h-72 bg-white rounded-2xl border border-[#e2ebe4]" />
      </div>

      {/* Table skeleton */}
      <div className="h-64 bg-white rounded-2xl border border-[#e2ebe4]" />
    </div>
  )
}

