import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"
import { getServerSession } from "next-auth"
import { NextRequest, NextResponse } from "next/server"

type ResumoAlunoItem = {
  nome: string
  totalFez: number
  totalGeral: number
  porDisciplina: Record<string, { fez: number; total: number }>
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

    const turma = await prisma.turma.findFirst({
      where: {
        userId: session.user.id,
      },
      select: {
        disciplinas: true,
      },
    })

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
            subLicao: {
              select: {
                disciplina: true,
              },
            },
          },
        },
      },
      orderBy: { nome: "asc" }
    })

    const disciplinasTurma = turma?.disciplinas ?? []
    const disciplinasEntregas = Array.from(
      new Set(
        alunos.flatMap((aluno) =>
          aluno.entregas.map((entrega) => entrega.subLicao.disciplina)
        )
      )
    )
    const disciplinas = Array.from(
      new Set([...disciplinasTurma, ...disciplinasEntregas])
    )

    const resumoPorAluno: ResumoAlunoItem[] = alunos.map(aluno => {
      const porDisciplina = Object.fromEntries(
        disciplinas.map((disciplina) => [disciplina, { fez: 0, total: 0 }])
      ) as Record<string, { fez: number; total: number }>

      aluno.entregas.forEach((entrega) => {
        const disciplina = entrega.subLicao.disciplina
        porDisciplina[disciplina].total += 1
        if (entrega.status === "FEZ") {
          porDisciplina[disciplina].fez += 1
        }
      })

      const totalFez = aluno.entregas.filter((e) => e.status === "FEZ").length
      const totalGeral = aluno.entregas.length

      return {
        nome: aluno.nome,
        totalFez,
        totalGeral,
        porDisciplina,
      }
    })

    return NextResponse.json({
      disciplinas,
      rows: resumoPorAluno,
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Erro ao buscar dados" }, { status: 500 })
  }
}
