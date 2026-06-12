import { Skeleton } from "@/components/Skeleton";

export default function EstatisticasLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-40 mb-2" />

      {/* Gráfico */}
      <div>
        <Skeleton className="h-6 w-52 mb-3" />
        <Skeleton className="h-80 w-full rounded-xl" />
      </div>

      {/* Cards de stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="rounded-xl bg-white shadow p-4 space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-full" />
          </div>
        ))}
      </div>

      {/* Tabela pé quente/frio */}
      <div className="rounded-xl bg-white shadow divide-y divide-foreground/5">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3">
            <Skeleton className="h-5 w-5 rounded-full" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-12" />
          </div>
        ))}
      </div>
    </div>
  );
}
