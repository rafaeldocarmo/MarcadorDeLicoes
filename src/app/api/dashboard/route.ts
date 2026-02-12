import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"
import { getServerSession } from "next-auth"
import { NextRequest, NextResponse } from "next/server"

type ResumoAlunoItem = {
  nome: string
  fez: number
  naoFez: number
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const from = searchParams.get("from")
    const to = searchParams.get("to")

    const shouldFilterByDate = Boolean(from && to)
    const dateRangeFilter = shouldFilterByDate
      ? {
          updatedAt: {
            gte: new Date(from!),
            lte: new Date(to!),
          },
        }
      : {}

    const alunos = await prisma.aluno.findMany({
      where: {
        turma: {
          userId: session.user.id,
        },
      },
      select: {
        id: true,
        nome: true,
        entregas: {
          where: dateRangeFilter,
          select: {
            status: true,
          },
        },
      },
      orderBy: { nome: "asc" }
    })

    // Agrupar entregas por aluno
    const resumoPorAluno: ResumoAlunoItem[] = alunos.map(aluno => {
      return {
        nome: aluno.nome,
        fez: aluno.entregas.filter(e => e.status === "FEZ").length,
        naoFez: aluno.entregas.filter(e => e.status === "NAO_FEZ").length
      }
    })

    return NextResponse.json(resumoPorAluno)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Erro ao buscar dados" }, { status: 500 })
  }
}
