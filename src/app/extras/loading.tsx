import { Skeleton } from "@/components/Skeleton";

export default function ExtrasLoading() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Skeleton className="h-8 w-48 mb-2" />
      <Skeleton className="h-4 w-72 mb-6" />

      {/* Card campeão */}
      <div className="rounded-xl bg-white p-6 shadow space-y-3">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-3 w-64" />
        <Skeleton className="h-10 w-full rounded-lg" />
      </div>

      {/* Card extras */}
      <div className="rounded-xl bg-white p-6 shadow space-y-5">
        <Skeleton className="h-5 w-28" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}
