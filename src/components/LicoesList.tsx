"use client"

import { Fragment, useEffect, useState } from "react"
import Link from "next/link"
import { ChevronDown, ChevronRight } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

type Licao = {
  id: string
  titulo: string
  dataEnvio: string
  dataEntrega: string
  subLicoes: {
    id?: string
    disciplina: string
    material: string
    descricao?: string
  }[]
}

type Props = {
  pageSize?: number
}

type LicoesApiResponse = {
  items: Licao[]
  totalPages: number
  disciplinasDisponiveis: string[]
  materiaisDisponiveis: string[]
}

export default function LicoesList({ pageSize = 6 }: Props) {
  const [licoes, setLicoes] = useState<Licao[]>([])
  const [search, setSearch] = useState("")
  const [disciplinaFilter, setDisciplinaFilter] = useState<string | undefined>()
  const [materialFilter, setMaterialFilter] = useState<string | undefined>()
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [disciplinasDisponiveis, setDisciplinasDisponiveis] = useState<string[]>([])
  const [materiaisDisponiveis, setMateriaisDisponiveis] = useState<string[]>([])
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  function toggleExpanded(id: string) {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  useEffect(() => {
    async function fetchLicoes() {
      const params = new URLSearchParams()
      params.append("page", page.toString())
      params.append("pageSize", pageSize.toString())
      if (search) params.append("search", search)
      if (disciplinaFilter) params.append("disciplina", disciplinaFilter)
      if (materialFilter) params.append("material", materialFilter)

      const res = await fetch(`/api/licoes?${params.toString()}`)
      if (!res.ok) {
        setLicoes([])
        setTotalPages(1)
        return
      }

      const data: LicoesApiResponse = await res.json()
      setLicoes(data.items)
      setTotalPages(data.totalPages)
      setDisciplinasDisponiveis(data.disciplinasDisponiveis ?? [])
      setMateriaisDisponiveis(data.materiaisDisponiveis ?? [])
      setExpanded({})
    }

    fetchLicoes()
  }, [page, pageSize, search, disciplinaFilter, materialFilter])

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h2 className="text-2xl font-semibold">Lições</h2>
        <Button asChild>
          <Link href="/licoes">Criar nova Lição</Link>
        </Button>
      </div>

      <div className="flex flex-wrap gap-2 items-center justify-end">
        <Input
          placeholder="Buscar por título..."
          value={search}
          onChange={(e) => {
            setPage(1)
            setSearch(e.target.value)
          }}
          className="w-48"
        />

        <Select
          onValueChange={(v) => {
            setPage(1)
            setDisciplinaFilter(v === "ALL" ? undefined : v)
          }}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filtrar por disciplina" />
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
            setPage(1)
            setMaterialFilter(v === "ALL" ? undefined : v)
          }}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filtrar por material" />
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

      <div className="rounded-md border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12 px-2" />
              <TableHead className="min-w-[260px]">Título</TableHead>
              <TableHead className="w-[140px]">Data de envio</TableHead>
              <TableHead className="w-[140px]">Data de entrega</TableHead>
              <TableHead className="w-[140px] text-center">Qtd. sublições</TableHead>
              <TableHead className="w-[160px] text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {licoes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  Nenhuma lição encontrada.
                </TableCell>
              </TableRow>
            ) : (
              licoes.map((licao) => (
                <Fragment key={licao.id}>
                  <TableRow>
                    <TableCell className="px-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleExpanded(licao.id)}
                        aria-label="Expandir sublicoes"
                      >
                        {expanded[licao.id] ? <ChevronDown /> : <ChevronRight />}
                      </Button>
                    </TableCell>
                    <TableCell className="font-medium">{licao.titulo}</TableCell>
                    <TableCell>{new Date(licao.dataEnvio).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(licao.dataEntrega).toLocaleDateString()}</TableCell>
                    <TableCell className="text-center">{licao.subLicoes.length}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end">
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/licoes/${licao.id}`}>Ver detalhes</Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>

                  {expanded[licao.id] ? (
                    <TableRow>
                      <TableCell colSpan={6}>
                        <div className="rounded-md border bg-muted/30 p-3">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-16">#</TableHead>
                                <TableHead>Disciplina</TableHead>
                                <TableHead>Material</TableHead>
                                <TableHead>Descrição</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {licao.subLicoes.map((sub, index) => (
                                <TableRow key={sub.id ?? `${licao.id}-${index}`}>
                                  <TableCell>{index + 1}</TableCell>
                                  <TableCell>{sub.disciplina}</TableCell>
                                  <TableCell>{sub.material}</TableCell>
                                  <TableCell className="max-w-md truncate">
                                    {sub.descricao
                                      ? `${sub.descricao.slice(0, 80)}${sub.descricao.length > 80 ? "..." : ""}`
                                      : "-"}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : null}
                </Fragment>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-center gap-2 mt-4">
        <Button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
          Anterior
        </Button>
        <span className="px-2 py-1">
          {page} / {totalPages}
        </span>
        <Button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
          Próxima
        </Button>
      </div>
    </div>
  )
}
