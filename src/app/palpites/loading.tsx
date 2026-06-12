import { Skeleton } from "@/components/Skeleton";

export default function PalpitesLoading() {
  return (
    <div>
      <Skeleton className="h-8 w-48 mb-2" />
      <Skeleton className="h-4 w-80 mb-6" />

      {/* Barra de progresso */}
      <Skeleton className="h-2 w-full rounded-full mb-5" />

      {/* Filtros */}
      <div className="flex gap-2 mb-4">
        <Skeleton className="h-10 w-44 rounded-lg" />
        <Skeleton className="h-10 w-36 rounded-lg" />
      </div>

      {/* Dia */}
      <Skeleton className="h-4 w-48 mb-3" />
      <div className="grid gap-3 sm:grid-cols-2">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="rounded-xl bg-white p-4 shadow">
            <div className="flex justify-between mb-3">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-3 w-16" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 flex-1" />
              <Skeleton className="h-9 w-24 rounded-lg" />
              <Skeleton className="h-5 flex-1" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
