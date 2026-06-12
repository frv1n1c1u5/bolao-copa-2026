import { Skeleton } from "@/components/Skeleton";

export default function HomeLoading() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <section>
        <Skeleton className="h-6 w-40 mb-3" />
        <div className="rounded-xl bg-white shadow divide-y divide-foreground/5">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3">
              <Skeleton className="h-4 w-4 rounded-full" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 w-12" />
            </div>
          ))}
        </div>
      </section>
      <section>
        <Skeleton className="h-6 w-48 mb-3" />
        <div className="rounded-xl bg-white shadow divide-y divide-foreground/5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3">
              <Skeleton className="h-4 w-6" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 w-10" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
