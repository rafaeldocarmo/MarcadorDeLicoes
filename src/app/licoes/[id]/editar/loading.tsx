import { Skeleton } from "@/components/ui/skeleton"

export default function LoadingEditarLicao() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 p-6">
      <div className="w-full max-w-3xl space-y-6 rounded-2xl border bg-background p-6">
        <Skeleton className="h-8 w-44" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-10 w-44" />
      </div>
    </div>
  )
}
