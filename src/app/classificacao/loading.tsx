import { Skeleton } from "@/components/Skeleton";

export default function ClassificacaoLoading() {
  return (
    <div>
      <Skeleton className="h-8 w-48 mb-2" />
      <Skeleton className="h-4 w-72 mb-6" />

      <div className="rounded-xl bg-white shadow overflow-hidden">
        {/* Cabeçalho da tabela */}
        <div className="flex gap-4 px-4 py-3 border-b border-foreground/10">
          <Skeleton className="h-3 w-6" />
          <Skeleton className="h-3 flex-1" />
          <Skeleton className="h-3 w-8" />
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-3 w-16" />
        </div>
        {[...Array(8)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3 border-b border-foreground/5 last:border-0">
            <Skeleton className="h-5 w-6 rounded" />
            <div className="flex items-center gap-2 flex-1">
              <Skeleton className="h-5 w-5 rounded-full" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-5 w-8" />
            <Skeleton className="h-4 w-8" />
            <Skeleton className="h-4 w-10" />
          </div>
        ))}
      </div>
    </div>
  );
}
