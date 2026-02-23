"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type MemberRole = "EDITOR" | "VIEWER"

type MemberInput = {
  userId?: string
  email: string
  role: MemberRole
}

type Props = {
  mode?: "create" | "edit"
  allowManageMembers?: boolean
  initialTurmaId?: string
  initialNome?: string
  initialAlunos?: string[]
  initialDisciplinas?: string[]
  initialMateriais?: string[]
  initialMembers?: MemberInput[]
}

type TurmaResponse = {
  id: string
}

function normalizeMembers(members: MemberInput[]) {
  const byEmail = new Map<string, MemberInput>()

  for (const member of members) {
    const normalizedEmail = member.email.trim().toLowerCase()
    if (!normalizedEmail) continue
    byEmail.set(normalizedEmail, {
      userId: member.userId,
      email: normalizedEmail,
      role: member.role,
    })
  }

  return Array.from(byEmail.values())
}

export default function NovaTurmaForm({
  mode = "create",
  allowManageMembers = true,
  initialTurmaId,
  initialNome = "",
  initialAlunos = [""],
  initialDisciplinas = [""],
  initialMateriais = [""],
  initialMembers = [],
}: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const [nome, setNome] = useState(initialNome)
  const [alunos, setAlunos] = useState<string[]>(
    initialAlunos.length > 0 ? initialAlunos : [""]
  )
  const [disciplinas, setDisciplinas] = useState<string[]>(
    initialDisciplinas.length > 0 ? initialDisciplinas : [""]
  )
  const [materiais, setMateriais] = useState<string[]>(
    initialMateriais.length > 0 ? initialMateriais : [""]
  )
  const [members, setMembers] = useState<MemberInput[]>(initialMembers)

  const normalizedMembers = useMemo(() => normalizeMembers(members), [members])

  function adicionarAluno() {
    setAlunos((prev) => [...prev, ""])
  }

  function removerAluno(index: number) {
    setAlunos((prev) => prev.filter((_, i) => i !== index))
  }

  function atualizarAluno(index: number, value: string) {
    setAlunos((prev) => prev.map((item, i) => (i === index ? value : item)))
  }

  function adicionarDisciplina() {
    setDisciplinas((prev) => [...prev, ""])
  }

  function removerDisciplina(index: number) {
    setDisciplinas((prev) => prev.filter((_, i) => i !== index))
  }

  function atualizarDisciplina(index: number, value: string) {
    setDisciplinas((prev) =>
      prev.map((item, i) => (i === index ? value : item))
    )
  }

  function adicionarMaterial() {
    setMateriais((prev) => [...prev, ""])
  }

  function removerMaterial(index: number) {
    setMateriais((prev) => prev.filter((_, i) => i !== index))
  }

  function atualizarMaterial(index: number, value: string) {
    setMateriais((prev) =>
      prev.map((item, i) => (i === index ? value : item))
    )
  }

  function adicionarMembro() {
    setMembers((prev) => [...prev, { email: "", role: "VIEWER" }])
  }

  function removerMembro(index: number) {
    setMembers((prev) => prev.filter((_, i) => i !== index))
  }

  function atualizarMembro(index: number, patch: Partial<MemberInput>) {
    setMembers((prev) => prev.map((member, i) => (i === index ? { ...member, ...patch } : member)))
  }

  async function syncMembers(turmaId: string) {
    const currentRes = await fetch(`/api/turmas/${turmaId}/members`, {
      method: "GET",
    })

    if (!currentRes.ok) {
      throw new Error("Não foi possível carregar os membros atuais")
    }

    const currentMembers = (await currentRes.json()) as MemberInput[]

    const desiredByEmail = new Map(
      normalizedMembers.map((member) => [member.email.toLowerCase(), member])
    )

    for (const current of currentMembers) {
      const existing = desiredByEmail.get(current.email.toLowerCase())
      if (!existing) {
        const deleteRes = await fetch(`/api/turmas/${turmaId}/members`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId: current.userId }),
        })

        if (!deleteRes.ok) {
          const data = await deleteRes.json().catch(() => ({}))
          throw new Error(data.error ?? `Não foi possível remover ${current.email}`)
        }
      }
    }

    for (const desired of normalizedMembers) {
      const upsertRes = await fetch(`/api/turmas/${turmaId}/members`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: desired.email,
          role: desired.role,
        }),
      })

      if (!upsertRes.ok) {
        const data = await upsertRes.json().catch(() => ({}))
        throw new Error(data.error ?? `Não foi possível atribuir permissão para ${desired.email}`)
      }
    }
  }

  async function handleSubmit(formData: FormData) {
    setErrorMessage(null)

    startTransition(async () => {
      const res = await fetch("/api/turmas", {
        method: mode === "edit" ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          turmaId: mode === "edit" ? initialTurmaId : undefined,
          nome: nome || (formData.get("nome") as string),
          alunos: alunos.filter((a) => a.trim() !== ""),
          disciplinas: disciplinas.filter((d) => d.trim() !== ""),
          materiais: materiais.filter((m) => m.trim() !== ""),
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setErrorMessage(data.error ?? "Não foi possível salvar a turma")
        return
      }

      const turma = (await res.json()) as TurmaResponse
      const turmaId = mode === "edit" ? (initialTurmaId ?? turma.id) : turma.id

      if (turmaId && allowManageMembers) {
        try {
          await syncMembers(turmaId)
        } catch (error) {
          setErrorMessage(error instanceof Error ? error.message : "Erro ao salvar permissões")
          return
        }
      }

      router.push("/home")
      router.refresh()
    })
  }

  return (
    <div className="h-full flex items-center justify-center bg-muted/40 p-6">
      <Card className="w-full max-w-2xl rounded-2xl shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-semibold">
            {mode === "edit" ? "Editar Sala" : "Criar Nova Turma"}
          </CardTitle>
          <CardDescription>
            {mode === "edit"
              ? "Atualize o nome da sala, alunos, disciplinas, materiais e permissões dos membros."
              : "Bem-vindo! Crie sua sala personalizada para gerenciar as lições de seus alunos."}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form action={handleSubmit} className="space-y-8">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome da Turma</Label>
              <Input
                id="nome"
                name="nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
              />
            </div>

            {allowManageMembers ? (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Permissões de membros</h2>

                {members.length === 0 ? (
                  <p className="text-sm text-slate-500">Nenhum membro com permissão adicional.</p>
                ) : null}

                {members.map((member, index) => (
                  <div key={`member-${index}`} className="grid grid-cols-1 gap-2 md:grid-cols-[1fr_160px_auto]">
                    <Input
                      value={member.email}
                      onChange={(e) => atualizarMembro(index, { email: e.target.value })}
                      placeholder="Email do usuário"
                      type="email"
                      required
                    />
                    <Select
                      value={member.role}
                      onValueChange={(value: MemberRole) => atualizarMembro(index, { role: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Permissão" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="VIEWER">Visualização</SelectItem>
                        <SelectItem value="EDITOR">Edição</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => removerMembro(index)}
                    >
                      Remover
                    </Button>
                  </div>
                ))}

                <Button type="button" variant="outline" onClick={adicionarMembro}>
                  + Adicionar membro
                </Button>
              </div>
            ) : null}

            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Alunos</h2>

              {alunos.map((aluno, index) => (
                <div key={`aluno-${index}`} className="flex gap-2">
                  <Input
                    value={aluno}
                    onChange={(e) => atualizarAluno(index, e.target.value)}
                    placeholder="Nome do aluno"
                    required
                  />
                  {alunos.length > 1 && (
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => removerAluno(index)}
                    >
                      X
                    </Button>
                  )}
                </div>
              ))}

              <Button type="button" variant="outline" onClick={adicionarAluno}>
                + Adicionar Aluno
              </Button>
            </div>

            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Disciplinas da Turma</h2>

              {disciplinas.map((disciplina, index) => (
                <div key={`disciplina-${index}`} className="flex gap-2">
                  <Input
                    value={disciplina}
                    onChange={(e) => atualizarDisciplina(index, e.target.value)}
                    placeholder="Nome da disciplina"
                    required
                  />
                  {disciplinas.length > 1 && (
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => removerDisciplina(index)}
                    >
                      X
                    </Button>
                  )}
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                onClick={adicionarDisciplina}
              >
                + Adicionar Disciplina
              </Button>
            </div>

            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Materiais da Turma</h2>

              {materiais.map((material, index) => (
                <div key={`material-${index}`} className="flex gap-2">
                  <Input
                    value={material}
                    onChange={(e) => atualizarMaterial(index, e.target.value)}
                    placeholder="Nome do material"
                    required
                  />
                  {materiais.length > 1 && (
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => removerMaterial(index)}
                    >
                      X
                    </Button>
                  )}
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                onClick={adicionarMaterial}
              >
                + Adicionar Material
              </Button>
            </div>

            {errorMessage ? (
              <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {errorMessage}
              </p>
            ) : null}

            <div className="flex justify-end">
              <Button disabled={isPending}>
                {isPending
                  ? "Salvando..."
                  : mode === "edit"
                    ? "Salvar Sala"
                    : "Criar Turma"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
