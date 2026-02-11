import type { TooltipProps } from "recharts"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function CustomTooltip({ active, payload, label }: TooltipProps<any, any>) {
  if (!active || !payload || !payload.length) return null

  const data = payload[0].payload

  return (
    <div className="rounded-lg border bg-background p-3 shadow-md text-sm space-y-2 min-w-[220px]">
      <div className="font-semibold">{label}</div>

      {/* NAO FEZ */}
      <div>
        <div className="list-disc list-inside text-muted-foreground text-red-500">
          {data.disciplinasNaoFez?.map((d: string) => (
            <p key={d}>{d}</p>
          ))}
        </div>
      </div>
      
      {/* FEZ */}
      <div>
        <div className="list-disc list-inside text-muted-foreground text-green-500">
          {data.disciplinasFez?.map((d: string) => (
            <p key={d}>{d}</p>
          ))}
        </div>
      </div>

    </div>
  )
}
