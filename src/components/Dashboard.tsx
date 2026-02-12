"use client"

import { useEffect, useState } from "react"
import { DateRange } from "react-day-picker"
import { addDays } from "date-fns"

import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

import ResumoChart from "./ResumoChart"

export type ResumoAlunoItem = {
  nome: string
  fez: number
  naoFez: number
}

export default function Dashboard() {
  const [date, setDate] = useState<DateRange | undefined>({
    from: addDays(new Date(), -30),
    to: new Date(),
  })

  const [data, setData] = useState<ResumoAlunoItem[]>([])
  const [loading, setLoading] = useState(true)

  // 🔹 Busca inicial
  useEffect(() => {
    fetch("/api/dashboard")
      .then(res => res.json())
      .then((res: ResumoAlunoItem[]) => {
        setData(res)
        setLoading(false)
      })
  }, [])

  // 🔹 Filtro por período
  async function handleFilter() {
    if (!date?.from || !date?.to) return

    setLoading(true)

    const res = await fetch(
      `/api/resumo?from=${date.from.toISOString()}&to=${date.to.toISOString()}`
    )

    const filtered: ResumoAlunoItem[] = await res.json()
    setData(filtered)
    setLoading(false)
  }

  if (loading) return <p>Carregando...</p>

  return (
    <div className="space-y-6">
      {/* Filtro */}
      <div className="flex items-center gap-4">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline">
              Selecionar período
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="range"
              selected={date}
              onSelect={setDate}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>

        <Button onClick={handleFilter}>
          Filtrar
        </Button>
      </div>

      {/* Gráfico */}
      <ResumoChart data={data} />
    </div>
  )
}
