import { Skeleton } from "@/components/ui/skeleton"

export default function LoadingLicaoDetalhe() {
  return (
    <div className="min-h-screen bg-muted/40 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-[360px] w-full" />
        <div className="flex justify-between">
          <Skeleton className="h-10 w-36" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-36" />
          </div>
        </div>
      </div>
    </div>
  )
}
