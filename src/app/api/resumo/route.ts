import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

// Tipo do objeto de resumo por aluno
type ResumoAluno = {
  nome: string
  fez: number
  naoFez: number
}

// Tipo de cada entrega com aluno incluído
type EntregaComAluno = {
  id: string
  alunoId: string
  status: "FEZ" | "NAO_FEZ"
  updatedAt: Date
  aluno: {
    id: string
    nome: string
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)

  const from = searchParams.get("from")
  const to = searchParams.get("to")

  if (!from || !to) {
    return NextResponse.json<ResumoAluno[]>([])
  }

  // Buscar entregas no período
  const entregas: EntregaComAluno[] = await prisma.entregaSubLicao.findMany({
    where: {
      updatedAt: {
        gte: new Date(from),
        lte: new Date(to),
      },
    },
    include: {
      aluno: true,
    },
  })

  // Agrupar por aluno
  const resumo: Record<string, ResumoAluno> = {}

  entregas.forEach((e: EntregaComAluno) => {
    if (!resumo[e.alunoId]) {
      resumo[e.alunoId] = {
        nome: e.aluno.nome,
        fez: 0,
        naoFez: 0,
      }
    }

    if (e.status === "FEZ") {
      resumo[e.alunoId].fez++
    } else {
      resumo[e.alunoId].naoFez++
    }
  })

  // Retorna como array tipado
  return NextResponse.json<ResumoAluno[]>(Object.values(resumo))
}
