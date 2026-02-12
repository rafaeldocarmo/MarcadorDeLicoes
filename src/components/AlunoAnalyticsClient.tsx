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

type TimelineItem = {
  data: string
  fez: number
  naoFez: number
  disciplinasFez: string[]
  disciplinasNaoFez: string[]
}

type DisciplinaItem = {
  disciplina: string
  fez: number
  naoFez: number
}

type AlunoAnalyticsData = {
  timeline: TimelineItem[]
  disciplinas: DisciplinaItem[]
  geral: {
    fez: number
    naoFez: number
  }
}

async function fetchAlunoAnalytics(alunoId: string): Promise<AlunoAnalyticsData> {
  const response = await fetch(`/api/aluno-analytics?id=${alunoId}`)
  return (await response.json()) as AlunoAnalyticsData
}

export default function AlunoAnalyticsClient({ alunos }: Props) {
  const [selectedAluno, setSelectedAluno] = useState<string | undefined>(
    alunos[0]?.id
  )

  const [data, setData] = useState<AlunoAnalyticsData | null>(null)

  useEffect(() => {
    if (!selectedAluno) return

    fetchAlunoAnalytics(selectedAluno)
      .then(setData)
  }, [selectedAluno])

  return (
    <div className="space-y-6">

      <h1 className="text-[1.5rem] font-semibold">Visão por Aluno</h1>

      <Select value={selectedAluno} onValueChange={setSelectedAluno}>
        <SelectTrigger className="w-[250px]">
          <SelectValue placeholder="Selecionar aluno" />
        </SelectTrigger>
        <SelectContent>
          {alunos.map((aluno: Aluno) => (
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
