"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type Licao = {
  id: string
  dataEnvio: string
  dataEntrega: string
  subLicoes: {
    id?: string
    disciplina: string
    material: string
    descricao?: string
  }[]
}

type LicoesApiResponse = {
  items: Licao[]
  totalPages: number
  disciplinasDisponiveis: string[]
  materiaisDisponiveis: string[]
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1)
}

function normalizeDate(dateString: string) {
  const d = new Date(dateString)
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

function toLocalDateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function abbreviateDisciplina(disciplina: string) {
  const words = disciplina.trim().split(/\s+/).filter(Boolean)

  if (words.length > 1) {
    return words
      .slice(0, 3)
      .map((word) => word[0]?.toUpperCase() ?? "")
      .join("")
  }

  return words[0]?.slice(0, 3).toUpperCase() ?? "---"
}

function getDisciplinaBadges(licao: Licao) {
  const unique = new Set(licao.subLicoes.map((sub) => sub.disciplina))
  return [...unique].map(abbreviateDisciplina)
}

const WEEK_DAYS = ["Seg", "Ter", "Qua", "Qui", "Sex"]

export default function LicoesList() {
  const router = useRouter()
  const [licoes, setLicoes] = useState<Licao[]>([])
  const [disciplinaFilter, setDisciplinaFilter] = useState<string | undefined>()
  const [materialFilter, setMaterialFilter] = useState<string | undefined>()
  const [disciplinasDisponiveis, setDisciplinasDisponiveis] = useState<string[]>([])
  const [materiaisDisponiveis, setMateriaisDisponiveis] = useState<string[]>([])
  const [monthCursor, setMonthCursor] = useState(() => startOfMonth(new Date()))

  useEffect(() => {
    async function fetchLicoes() {
      const params = new URLSearchParams()
      params.append("page", "1")
      params.append("pageSize", "500")
      if (disciplinaFilter) params.append("disciplina", disciplinaFilter)
      if (materialFilter) params.append("material", materialFilter)

      const res = await fetch(`/api/licoes?${params.toString()}`)
      if (!res.ok) {
        setLicoes([])
        return
      }

      const data: LicoesApiResponse = await res.json()
      setLicoes(data.items)
      setDisciplinasDisponiveis(data.disciplinasDisponiveis ?? [])
      setMateriaisDisponiveis(data.materiaisDisponiveis ?? [])
    }

    fetchLicoes()
  }, [disciplinaFilter, materialFilter])

  const monthLabel = useMemo(
    () =>
      new Intl.DateTimeFormat("pt-BR", {
        month: "long",
        year: "numeric",
      }).format(monthCursor),
    [monthCursor],
  )

  const licoesByDay = useMemo(() => {
    const grouped = new Map<string, Licao[]>()

    for (const licao of licoes) {
      const key = toLocalDateKey(normalizeDate(licao.dataEntrega))
      const list = grouped.get(key) ?? []
      list.push(licao)
      grouped.set(key, list)
    }

    return grouped
  }, [licoes])

  const calendarDays = useMemo(() => {
    const year = monthCursor.getFullYear()
    const month = monthCursor.getMonth()
    const lastDay = new Date(year, month + 1, 0).getDate()
    const days: Date[] = []

    for (let day = 1; day <= lastDay; day += 1) {
      const current = new Date(year, month, day)
      const weekDay = current.getDay()
      if (weekDay >= 1 && weekDay <= 5) {
        days.push(current)
      }
    }

    return days
  }, [monthCursor])

  function openCreateLicaoWithDate(day: Date) {
    const dateKey = toLocalDateKey(day)
    router.push(`/licoes?dataEntrega=${dateKey}`)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h2 className="text-2xl font-semibold">Agenda de Lições</h2>
        <Button asChild>
          <Link href="/licoes">Criar nova lição</Link>
        </Button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setMonthCursor((prev) => addMonths(prev, -1))}
            aria-label="Mes anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-44 text-center text-sm font-medium capitalize">{monthLabel}</div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setMonthCursor((prev) => addMonths(prev, 1))}
            aria-label="Proximo mes"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <Select
            onValueChange={(v) => {
              setDisciplinaFilter(v === "ALL" ? undefined : v)
            }}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filtrar disciplina" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todas</SelectItem>
              {disciplinasDisponiveis.map((disciplina) => (
                <SelectItem key={disciplina} value={disciplina}>
                  {disciplina}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            onValueChange={(v) => {
              setMaterialFilter(v === "ALL" ? undefined : v)
            }}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filtrar material" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos</SelectItem>
              {materiaisDisponiveis.map((material) => (
                <SelectItem key={material} value={material}>
                  {material}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2 rounded-xl p-3 shadow-sm">
        <div className="grid grid-cols-5 gap-2">
          {WEEK_DAYS.map((weekday) => (
            <div
              key={weekday}
              className="rounded-md border border-border/60 bg-white py-1.5 text-center text-[10px] font-semibold uppercase tracking-wide text-muted-foreground"
            >
              {weekday}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-5 gap-2">
          {calendarDays.map((day) => {
            const key = toLocalDateKey(day)
            const dayLicoes = licoesByDay.get(key) ?? []

            return (
              <div
                key={key}
                role="button"
                tabIndex={0}
                onClick={() => openCreateLicaoWithDate(day)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault()
                    openCreateLicaoWithDate(day)
                  }
                }}
                className="min-h-[85px] cursor-pointer rounded-md border border-border/70 bg-background p-1.5 shadow-[0_1px_0_rgba(0,0,0,0.03)] transition-colors hover:border-primary/40"
              >
                <div className="mb-1 text-right text-[11px] font-semibold text-muted-foreground">{day.getDate()}</div>

                <div className="space-y-1">
                  {dayLicoes.map((licao) => (
                    <Link
                      key={licao.id}
                      href={`/licoes/${licao.id}`}
                      onClick={(event) => event.stopPropagation()}
                      className="block rounded-md border border-[#d8d7d29b] bg-[#FFFDF2] px-1.5 py-1 text-[9px] leading-tight shadow-sm transition-colors hover:bg-primary/10"
                    >
                      <div className="flex flex-wrap gap-1 font-medium">
                        {getDisciplinaBadges(licao).map((badge) => (
                          <span
                            key={`${licao.id}-${badge}`}
                            className="rounded-sm border px-1 py-0.5 text-[14px] font-semibold text-primary/90"
                          >
                            {badge}
                          </span>
                        ))}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {licoes.length === 0 ? (
        <p className="text-xs text-muted-foreground">Nenhuma licao encontrada com os filtros atuais.</p>
      ) : null}

    </div>
  )
}
