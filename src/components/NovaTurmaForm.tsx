"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function NovaTurmaForm() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [alunos, setAlunos] = useState<string[]>([""])

  function adicionarAluno() {
    setAlunos(prev => [...prev, ""])
  }

  function removerAluno(index: number) {
    setAlunos(prev => prev.filter((_, i) => i !== index))
  }

  function atualizarAluno(index: number, value: string) {
    setAlunos(prev =>
      prev.map((nome, i) => (i === index ? value : nome))
    )
  }

  async function handleSubmit(formData: FormData) {
    const nome = formData.get("nome") as string

    startTransition(async () => {
      const res = await fetch("/api/turmas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          nome,
          alunos: alunos.filter(a => a.trim() !== "")
        })
      })

      if (res.ok) {
        const turma = await res.json()
        router.push(`/turmas/${turma.id}`)
      }
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 p-6">
      <Card className="w-full max-w-2xl rounded-2xl shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold">
            Criar Nova Turma
          </CardTitle>
        </CardHeader>

        <CardContent>
          <form action={handleSubmit} className="space-y-8">

            <div className="space-y-2">
              <Label htmlFor="nome">Nome da Turma</Label>
              <Input id="nome" name="nome" required />
            </div>

            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Alunos</h2>

              {alunos.map((aluno, index) => (
                <div key={index} className="flex gap-2">
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

              <Button
                type="button"
                variant="outline"
                onClick={adicionarAluno}
              >
                + Adicionar Aluno
              </Button>
            </div>

            <div className="flex justify-end">
              <Button disabled={isPending}>
                {isPending ? "Criando..." : "Criar Turma"}
              </Button>
            </div>

          </form>
        </CardContent>
      </Card>
    </div>
  )
}
