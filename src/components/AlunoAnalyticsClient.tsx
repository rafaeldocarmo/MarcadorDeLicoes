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
  falta: number
  disciplinasFez: string[]
  disciplinasNaoFez: string[]
  disciplinasFalta: string[]
}

type DisciplinaItem = {
  disciplina: string
  fez: number
  naoFez: number
  falta: number
}

type AlunoAnalyticsData = {
  timeline: TimelineItem[]
  disciplinas: DisciplinaItem[]
  geral: {
    fez: number
    naoFez: number
    falta: number
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
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-sky-700/80">Aluno</p>
        <h2 className="text-[1.4rem] font-semibold text-slate-900">Visão por aluno</h2>
      </div>

      <div className="rounded-xl border border-sky-100 bg-[#f8fbff] p-3">
        <Select value={selectedAluno} onValueChange={setSelectedAluno}>
          <SelectTrigger className="w-[280px] border-sky-100 bg-white">
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
      </div>

      {!data ? (
        <p className="text-sm text-slate-500">Selecione um aluno para ver os gráficos.</p>
      ) : (
        <>
          <div className="grid gap-6 lg:grid-cols-2">
            <GeralAlunoChart data={data.geral} />
            <DisciplinaChart data={data.disciplinas} />
          </div>
          <TimelineChart data={data.timeline} />
        </>
      )}
    </div>
  )
}

