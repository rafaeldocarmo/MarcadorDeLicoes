"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
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

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"
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
  porDia: Record<string, { total: number; fez: number; pendentes: string[] }>
}

type DashboardResponse = {
  mes: string
  dias: number[]
  rows: DashboardRow[]
}

type FilterMode = "month" | "currentWeek"

function getCurrentMonthValue() {
  const now = new Date()
  const year = now.getUTCFullYear()
  const month = String(now.getUTCMonth() + 1).padStart(2, "0")
  return `${year}-${month}`
}

function getMonthDateRange(monthValue: string) {
  const [yearText, monthText] = monthValue.split("-")
  const year = Number(yearText)
  const month = Number(monthText)

  if (!year || !month) {
    return getMonthDateRange(getCurrentMonthValue())
  }

  const from = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0))
  const to = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999))

  return { from, to }
}

function getCurrentWeekDateRange() {
  const now = new Date()
  const utcToday = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0)
  )
  const dayOfWeek = utcToday.getUTCDay()
  const mondayOffset = (dayOfWeek + 6) % 7

  const from = new Date(utcToday)
  from.setUTCDate(utcToday.getUTCDate() - mondayOffset)

  const to = new Date(from)
  to.setUTCDate(from.getUTCDate() + 6)
  to.setUTCHours(23, 59, 59, 999)

  return { from, to }
}

export default function Dashboard() {
  const [filterMode, setFilterMode] = useState<FilterMode>("month")
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonthValue())
  const [rows, setRows] = useState<DashboardRow[]>([])
  const [days, setDays] = useState<number[]>([])
  const [loading, setLoading] = useState(true)
  const [sorting, setSorting] = useState<SortingState>([])

  const loadDashboard = useCallback(async (from: Date, to: Date, showLoading = true) => {
    if (showLoading) {
      setLoading(true)
    }

    const params = new URLSearchParams()
    params.set("from", from.toISOString())
    params.set("to", to.toISOString())

    const queryString = params.toString()
    const endpoint = queryString ? `/api/dashboard?${queryString}` : "/api/dashboard"

    const res = await fetch(endpoint)

    if (!res.ok) {
      setRows([])
      setDays([])
      setLoading(false)
      return
    }

    const payload: DashboardResponse = await res.json()
    setRows(payload.rows ?? [])
    setDays(payload.dias ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    const applyFilter = async () => {
      if (filterMode === "currentWeek") {
        const range = getCurrentWeekDateRange()
        await loadDashboard(range.from, range.to, false)
        return
      }

      const range = getMonthDateRange(selectedMonth)
      await loadDashboard(range.from, range.to, false)
    }

    void applyFilter()
  }, [filterMode, selectedMonth, loadDashboard])

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
      ...days.map((day) => ({
        id: `dia-${day}`,
        accessorFn: (row: DashboardRow) => row.porDia[String(day)]?.fez ?? 0,
        header: ({ column }: HeaderContext<DashboardRow, unknown>) => (
          <Button
            variant="ghost"
            className="h-8 px-2 justify-center w-full"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            {day}
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }: { row: { original: DashboardRow } }) => {
          const values = row.original.porDia[String(day)]

          if (!values || values.total === 0) {
            return <span className="text-muted-foreground">-</span>
          }

          if (values.fez === values.total) {
            return <span className="font-semibold text-green-600">OK</span>
          }

          return (
            <span className="text-red-600">
              {values.pendentes.length ? values.pendentes.join(", ") : "Pendente"}
            </span>
          )
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
  }, [days])

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
          <ToggleGroup
            type="single"
            value={filterMode}
            onValueChange={(value) => {
              if (value === "month" || value === "currentWeek") {
                setFilterMode(value)
              }
            }}
            className="bg-[#fff]"
          >
            <ToggleGroupItem value="month" aria-label="Filtrar por mês">
              Mês
            </ToggleGroupItem>
            <ToggleGroupItem value="currentWeek" aria-label="Filtrar por semana atual">
              Semana atual
            </ToggleGroupItem>
          </ToggleGroup>

          <Input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            disabled={filterMode === "currentWeek"}
            className="w-[180px]"
          />
        </div>

        <Button asChild variant="outline">
          <Link href="/home/editar-sala">Alterar sala</Link>
        </Button>
      </div>

      <div className="rounded-md border bg-background overflow-x-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={
                      header.id === "nome"
                        ? "w-[280px] sticky left-0 z-20 bg-background border-r border-border shadow-[inset_-10px_0_10px_-10px_rgba(0,0,0,0.45)]"
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
                      className={
                        cell.column.id === "nome"
                          ? "sticky left-0 z-10 bg-background whitespace-nowrap border-r border-border shadow-[inset_-10px_0_10px_-10px_rgba(0,0,0,0.25)]"
                          : "text-center"
                      }
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

