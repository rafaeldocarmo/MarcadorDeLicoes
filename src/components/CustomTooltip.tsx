import type { TooltipProps } from "recharts"

type TooltipData = {
  disciplinasNaoFez?: string[]
  disciplinasFez?: string[]
  disciplinasFalta?: string[]
}

export function CustomTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload || !payload.length) return null

  const data = payload[0].payload as TooltipData
  const naoFez = data.disciplinasNaoFez ?? []
  const faltas = data.disciplinasFalta ?? []
  const fez = data.disciplinasFez ?? []

  return (
    <div className="min-w-[240px] space-y-2 rounded-xl border border-sky-100 bg-white p-3 text-sm shadow-lg">
      <div className="border-b border-sky-100 pb-1.5 font-semibold text-slate-800">{label}</div>

      {naoFez.length > 0 ? (
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-red-600">Não fez</p>
          <div className="space-y-0.5 text-red-500">
            {naoFez.map((d: string) => (
              <p key={d}>{d}</p>
            ))}
          </div>
        </div>
      ) : null}

      {faltas.length > 0 ? (
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-600">FA</p>
          <div className="space-y-0.5 text-amber-600">
            {faltas.map((d: string) => (
              <p key={d}>{d}</p>
            ))}
          </div>
        </div>
      ) : null}

      {fez.length > 0 ? (
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700">Fez</p>
          <div className="space-y-0.5 text-emerald-600">
            {fez.map((d: string) => (
              <p key={d}>{d}</p>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}
