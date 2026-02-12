"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
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

  async function loadDashboard(from?: Date, to?: Date, showLoading = true) {
    if (showLoading) {
      setLoading(true)
    }

    const params = new URLSearchParams()
    if (from && to) {
      params.set("from", from.toISOString())
      params.set("to", to.toISOString())
    }

    const queryString = params.toString()
    const endpoint = queryString ? `/api/dashboard?${queryString}` : "/api/dashboard"

    const res = await fetch(endpoint)

    if (!res.ok) {
      setData([])
      setLoading(false)
      return
    }

    const payload: ResumoAlunoItem[] = await res.json()
    setData(payload)
    setLoading(false)
  }

  useEffect(() => {
    const fetchInitialData = async () => {
      const res = await fetch("/api/dashboard")

      if (!res.ok) {
        setData([])
        setLoading(false)
        return
      }

      const payload: ResumoAlunoItem[] = await res.json()
      setData(payload)
      setLoading(false)
    }

    void fetchInitialData()
  }, [])

  async function handleFilter() {
    if (!date?.from || !date?.to) return
    await loadDashboard(date.from, date.to)
  }

  if (loading) return <p>Carregando...</p>

  return (
    <div className="space-y-6">

      <h1 className="text-[1.5rem] font-semibold">Visão da classe</h1>


      <div className="flex items-center justify-between gap-4">
        
        <div className="flex items-center gap-4">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">
                Selecionar periodo
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

        <Button asChild variant="outline">
          <Link href="/home/editar-sala">Alterar sala</Link>
        </Button>
      </div>

      <ResumoChart data={data} />
    </div>
  )
}
