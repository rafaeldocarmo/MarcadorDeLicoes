"use client"

import { useState, useTransition } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import Link from "next/link"

import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { addDays, format } from "date-fns"

type SubLicaoForm = {
  id?: string
  disciplina: string
  material: string
  descricao: string
}

type Props = {
  hasLicoes: boolean
  disciplinas: string[]
  materiais: string[]
  mode?: "create" | "edit"
  licaoId?: string
  initialDataEnvio?: string
  initialDataEntrega?: string
  initialSubLicoes?: SubLicaoForm[]
}

export default function NovaLicaoForm({
  hasLicoes,
  disciplinas,
  materiais,
  mode = "create",
  licaoId,
  initialDataEnvio,
  initialDataEntrega,
  initialSubLicoes,
}: Props) {
  const router = useRouter()
  const [subLicoes, setSubLicoes] = useState<SubLicaoForm[]>([
    ...(initialSubLicoes?.length
      ? initialSubLicoes
      : [{ disciplina: "", material: "", descricao: "" }]),
  ])
  const [isPending, startTransition] = useTransition()

  const [dataEnvio, setDataEnvio] = useState(
    initialDataEnvio ? new Date(initialDataEnvio) : new Date()
  )
  const [dataEntrega, setDataEntrega] = useState(() =>
    initialDataEntrega ? new Date(initialDataEntrega) : addDays(new Date(), 1)
  )

  const hasCatalogo = disciplinas.length > 0 && materiais.length > 0

  function adicionarSubLicao() {
    setSubLicoes((prev) => [
      ...prev,
      { disciplina: "", material: "", descricao: "" },
    ])
  }

  function removerSubLicao(index: number) {
    setSubLicoes((prev) => prev.filter((_, i) => i !== index))
  }

  function atualizarSubLicao(index: number, field: keyof SubLicaoForm, value: string) {
    setSubLicoes((prev) =>
      prev.map((sub, i) => (i === index ? { ...sub, [field]: value } : sub))
    )
  }

  function handleSubmit() {
    if (!hasCatalogo) return

    startTransition(async () => {
      const isEdit = mode === "edit" && Boolean(licaoId)
      const endpoint = isEdit ? `/api/licoes/${licaoId}` : "/api/nova-licao"
      const method = isEdit ? "PUT" : "POST"

      const res = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dataEnvio: dataEnvio.toISOString(),
          dataEntrega: dataEntrega.toISOString(),
          subLicoes,
        }),
      })

      if (!res.ok) return

      const licao = await res.json()
      if (licao.id) router.push(`/licoes/${licao.id}`)
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 p-6">
      <Card className="w-full max-w-3xl rounded-2xl shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold">
            {mode === "edit" ? "Editar lição" : "Criar nova lição"}
          </CardTitle>
          {!hasLicoes ? (
            <CardDescription>
              Esta será sua primeira lição. Crie uma lição para começar a visualizar os dados da sala.
            </CardDescription>
          ) : null}
          {!hasCatalogo ? (
            <CardDescription>
              Antes de criar lições, cadastre disciplinas e materiais na tela de editar sala.
            </CardDescription>
          ) : null}
        </CardHeader>

        <CardContent>
          <form action={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <Label>Data de Envio</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full text-left">
                      {format(dataEnvio, "dd/MM/yyyy")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dataEnvio}
                      onSelect={(date) => date && setDataEnvio(date)}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-1">
                <Label>Data de Entrega</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full text-left">
                      {format(dataEntrega, "dd/MM/yyyy")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dataEntrega}
                      onSelect={(date) => date && setDataEntrega(date)}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="space-y-6">
              {subLicoes.map((sub, index) => (
                <div
                  key={index}
                  className="relative rounded-2xl border bg-background p-6 shadow-sm space-y-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Disciplina</Label>
                      <Select
                        value={sub.disciplina}
                        onValueChange={(v) => atualizarSubLicao(index, "disciplina", v)}
                        required
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecione a disciplina" />
                        </SelectTrigger>
                        <SelectContent>
                          {disciplinas.map((d) => (
                            <SelectItem key={d} value={d}>
                              {d}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Material</Label>
                      <Select
                        value={sub.material}
                        onValueChange={(v) => atualizarSubLicao(index, "material", v)}
                        required
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecione o material" />
                        </SelectTrigger>
                        <SelectContent>
                          {materiais.map((m) => (
                            <SelectItem key={m} value={m}>
                              {m}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Descrição</Label>
                    <Textarea
                      value={sub.descricao}
                      onChange={(e) => atualizarSubLicao(index, "descricao", e.target.value)}
                      required
                    />
                  </div>
                  {subLicoes.length > 1 && (
                    <div className="flex justify-end">
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => removerSubLicao(index)}
                      >
                        Remover
                      </Button>
                    </div>
                  )}
                </div>
              ))}
              <Button type="button" variant="outline" onClick={adicionarSubLicao}>
                + Adicionar lição
              </Button>
            </div>

            <div className="flex justify-between">
              {hasLicoes ? (
                <Button className="rounded-2xl px-6" variant="destructive">
                  <Link href={mode === "edit" && licaoId ? `/licoes/${licaoId}` : "/home"}>
                    Cancelar
                  </Link>
                </Button>
              ) : (
                <span />
              )}
              <Button disabled={isPending || !hasCatalogo} className="rounded-2xl px-6">
                {isPending
                  ? mode === "edit"
                    ? "Salvando..."
                    : "Criando..."
                  : mode === "edit"
                    ? "Salvar lição"
                    : "Criar lição"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

