"use client"

import { useEffect, useState } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import TimelineChart from "./TimelineChart"
import DisciplinaChart from "./DisciplinaChart"
import GeralAlunoChart from "./GeralAlunoChart"

type Aluno = {
  id: string
  nome: string
}

type Props = {
  alunos: Aluno[]
}

export default function AlunoAnalyticsClient({ alunos }: Props) {
  const [selectedAluno, setSelectedAluno] = useState<string | undefined>(
    alunos[0]?.id
  )

  const [data, setData] = useState<any>(null)

  useEffect(() => {
    if (!selectedAluno) return

    fetch(`/api/aluno-analytics?id=${selectedAluno}`)
      .then((r) => r.json())
      .then(setData)
  }, [selectedAluno])

  return (
    <div className="space-y-6">
      <Select value={selectedAluno} onValueChange={setSelectedAluno}>
        <SelectTrigger className="w-[250px]">
          <SelectValue placeholder="Selecionar aluno" />
        </SelectTrigger>
        <SelectContent>
          {alunos.map((aluno) => (
            <SelectItem key={aluno.id} value={aluno.id}>
              {aluno.nome}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {data && (
        <>
          <div className="grid gap-6 md:grid-cols-2">
            <GeralAlunoChart data={data.geral} />
            <DisciplinaChart data={data.disciplinas} />
          </div>
          <TimelineChart data={data.timeline} />
        </>
      )}
    </div>
  )
}
