"use client"

import { useState, useTransition } from "react"
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

type Props = {
  mode?: "create" | "edit"
  initialNome?: string
  initialAlunos?: string[]
  initialDisciplinas?: string[]
  initialMateriais?: string[]
}

export default function NovaTurmaForm({
  mode = "create",
  initialNome = "",
  initialAlunos = [""],
  initialDisciplinas = [""],
  initialMateriais = [""],
}: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

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

  async function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const res = await fetch("/api/turmas", {
        method: mode === "edit" ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nome: nome || (formData.get("nome") as string),
          alunos: alunos.filter((a) => a.trim() !== ""),
          disciplinas: disciplinas.filter((d) => d.trim() !== ""),
          materiais: materiais.filter((m) => m.trim() !== ""),
        }),
      })

      if (res.ok) {
        router.push("/licoes")
        router.refresh()
      }
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
              ? "Atualize o nome da sala, alunos, disciplinas e materiais."
              : "Bem-vindo! Para iniciar o uso da aplicação, vocâ precisa criar uma turma primeiro."}
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
