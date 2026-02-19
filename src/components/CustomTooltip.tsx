import type { TooltipProps } from "recharts"

type TooltipData = {
  disciplinasNaoFez?: string[]
  disciplinasFez?: string[]
  disciplinasFalta?: string[]
}

export function CustomTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload || !payload.length) return null

  const data = payload[0].payload as TooltipData

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

      {/* FALTA */}
      <div>
        <div className="list-disc list-inside text-muted-foreground text-yellow-600">
          {data.disciplinasFalta?.map((d: string) => (
            <p key={d}>FA - {d}</p>
          ))}
        </div>
      </div>
      
      {/* FEZ */}
      <div>
        <div className="list-disc list-inside text-muted-foreground text-emerald-600">
          {data.disciplinasFez?.map((d: string) => (
            <p key={d}>{d}</p>
          ))}
        </div>
      </div>

    </div>
  )
}
