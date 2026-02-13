"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { DateRange } from "react-day-picker"
import { addDays } from "date-fns"
import {
  ColumnDef,
  HeaderContext,
  SortingState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { ArrowUpDown } from "lucide-react"

import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

type DashboardRow = {
  nome: string
  totalFez: number
  totalGeral: number
  porDisciplina: Record<string, { fez: number; total: number }>
}

type DashboardResponse = {
  disciplinas: string[]
  rows: DashboardRow[]
}

export default function Dashboard() {
  const [date, setDate] = useState<DateRange | undefined>({
    from: addDays(new Date(), -30),
    to: new Date(),
  })

  const [rows, setRows] = useState<DashboardRow[]>([])
  const [disciplinas, setDisciplinas] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [sorting, setSorting] = useState<SortingState>([])

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
      setRows([])
      setDisciplinas([])
      setLoading(false)
      return
    }

    const payload: DashboardResponse = await res.json()
    setRows(payload.rows ?? [])
    setDisciplinas(payload.disciplinas ?? [])
    setLoading(false)
  }

  useEffect(() => {
    const fetchInitialData = async () => {
      await loadDashboard(undefined, undefined, false)
    }

    void fetchInitialData()
  }, [])

  async function handleFilter() {
    if (!date?.from || !date?.to) return
    await loadDashboard(date.from, date.to)
  }

  const columns = useMemo<ColumnDef<DashboardRow>[]>(() => {
    const baseColumns: ColumnDef<DashboardRow>[] = [
      {
        accessorKey: "nome",
        header: ({ column }: HeaderContext<DashboardRow, unknown>) => (
          <Button
            variant="ghost"
            className="h-8 px-2 justify-start"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Nome do aluno
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => row.original.nome,
      },
      ...disciplinas.map((disciplina) => ({
        id: disciplina,
        accessorFn: (row: DashboardRow) => row.porDisciplina[disciplina]?.fez ?? 0,
        header: ({ column }: HeaderContext<DashboardRow, unknown>) => (
          <Button
            variant="ghost"
            className="h-8 px-2 justify-center w-full"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            {disciplina}
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }: { row: { original: DashboardRow } }) => {
          const values = row.original.porDisciplina[disciplina] ?? { fez: 0, total: 0 }
          return `${values.fez}/${values.total}`
        },
      })),
      {
        id: "total",
        accessorFn: (row) => row.totalFez,
        header: ({ column }: HeaderContext<DashboardRow, unknown>) => (
          <Button
            variant="ghost"
            className="h-8 px-2 justify-center w-full"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Total
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => `${row.original.totalFez}/${row.original.totalGeral}`,
      },
    ]

    return baseColumns
  }, [disciplinas])

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: rows,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  if (loading) return <p>Carregando...</p>

  return (
    <div className="space-y-6">
      <h1 className="text-[1.5rem] font-semibold">Visão da classe</h1>

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">Selecionar periodo</Button>
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

          <Button onClick={handleFilter}>Filtrar</Button>
        </div>

        <Button asChild variant="outline">
          <Link href="/home/editar-sala">Alterar sala</Link>
        </Button>
      </div>

      <div className="rounded-md border bg-background">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={
                      header.id === "nome"
                        ? "w-[280px]"
                        : "text-center"
                    }
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={cell.column.id === "nome" ? "" : "text-center"}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  Nenhum dado encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
