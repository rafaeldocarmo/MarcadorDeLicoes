"use client"

import { useState } from "react"
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

type Props = {
  initialData: any[]
}

export default function Dashboard({ initialData }: Props) {
  const [date, setDate] = useState<DateRange | undefined>({
    from: addDays(new Date(), -30),
    to: new Date(),
  })

  const [data, setData] = useState(initialData)

  async function handleFilter() {
    if (!date?.from || !date?.to) return

    const res = await fetch(
      `/api/resumo?from=${date.from.toISOString()}&to=${date.to.toISOString()}`
    )

    const filtered = await res.json()
    setData(filtered)
  }

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
