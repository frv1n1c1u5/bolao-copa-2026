import { Skeleton } from "@/components/Skeleton";

export default function PremiacaoLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-40 mb-2" />

      {/* Pote */}
      <div className="rounded-xl bg-white shadow p-6 space-y-3">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-12 w-48" />
      </div>

      {/* Pódio */}
      <div className="flex items-end justify-center gap-3 h-44">
        <Skeleton className="flex-1 rounded-xl h-32" />
        <Skeleton className="flex-1 rounded-xl h-44" />
        <Skeleton className="flex-1 rounded-xl h-24" />
      </div>

      {/* Bônus */}
      <div className="rounded-xl bg-white shadow overflow-hidden">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-foreground/5 last:border-0">
            <Skeleton className="h-5 w-5 rounded" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}
