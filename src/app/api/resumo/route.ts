import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)

  const from = searchParams.get("from")
  const to = searchParams.get("to")

  if (!from || !to) {
    return NextResponse.json([])
  }

  const entregas = await prisma.entregaSubLicao.findMany({
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

  // Agrupar manualmente
  const resumo: Record<string, { nome: string; fez: number; naoFez: number }> = {}

  entregas.forEach((e) => {
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

  return NextResponse.json(Object.values(resumo))
}
