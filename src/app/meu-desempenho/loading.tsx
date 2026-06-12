import { Skeleton } from "@/components/Skeleton";

export default function MeuDesempenhoLoading() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Skeleton className="h-8 w-64 mb-2" />

      {/* Card de posição */}
      <div className="rounded-xl bg-white shadow p-5 flex items-center gap-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="space-y-1 text-right">
          <Skeleton className="h-9 w-16 ml-auto" />
          <Skeleton className="h-3 w-12 ml-auto" />
        </div>
      </div>

      {/* Stats rápidas */}
      <div className="grid grid-cols-3 gap-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="rounded-xl bg-white shadow p-4 text-center space-y-2">
            <Skeleton className="h-7 w-8 mx-auto" />
            <Skeleton className="h-3 w-16 mx-auto" />
          </div>
        ))}
      </div>

      {/* Histórico */}
      <Skeleton className="h-6 w-48" />
      <div className="rounded-xl bg-white shadow overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-foreground/5 last:border-0">
            <div className="flex-1 space-y-1">
              <Skeleton className="h-4 w-56" />
              <Skeleton className="h-3 w-36" />
            </div>
            <Skeleton className="h-6 w-14 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
