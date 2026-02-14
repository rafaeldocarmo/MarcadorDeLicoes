import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"
import { getServerSession } from "next-auth"
import { NextRequest, NextResponse } from "next/server"

type DiaResumo = {
  total: number
  fez: number
  pendentes: string[]
}

type ResumoAlunoItem = {
  nome: string
  totalFez: number
  totalGeral: number
  porDia: Record<string, DiaResumo>
}

function getMonthRange(fromParam: string | null, toParam: string | null) {
  if (fromParam && toParam) {
    const fromDate = new Date(fromParam)
    const toDate = new Date(toParam)

    if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
      throw new Error("Intervalo de data invalido")
    }

    return { monthStart: fromDate, monthEnd: toDate }
  }

  const now = new Date()
  const year = now.getUTCFullYear()
  const month = now.getUTCMonth()

  return {
    monthStart: new Date(Date.UTC(year, month, 1, 0, 0, 0, 0)),
    monthEnd: new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999)),
  }
}

function getDaysInRange(from: Date, to: Date) {
  const days: number[] = []
  const cursor = new Date(
    Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate(), 0, 0, 0, 0)
  )
  const end = new Date(
    Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate(), 0, 0, 0, 0)
  )

  while (cursor.getTime() <= end.getTime()) {
    days.push(cursor.getUTCDate())
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }

  return days
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const from = searchParams.get("from")
    const to = searchParams.get("to")

    const { monthStart, monthEnd } = getMonthRange(from, to)
    const days = getDaysInRange(monthStart, monthEnd)

    const alunos = await prisma.aluno.findMany({
      where: {
        turma: {
          userId: session.user.id,
        },
      },
      select: {
        nome: true,
        entregas: {
          where: {
            subLicao: {
              licao: {
                dataEnvio: {
                  gte: monthStart,
                  lte: monthEnd,
                },
              },
            },
          },
          select: {
            status: true,
            subLicao: {
              select: {
                disciplina: true,
                licao: {
                  select: {
                    dataEnvio: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { nome: "asc" }
    })

    const resumoPorAluno: ResumoAlunoItem[] = alunos.map(aluno => {
      const porDiaComSet = Object.fromEntries(
        days.map((day) => [
          String(day),
          { total: 0, fez: 0, pendentes: new Set<string>() },
        ])
      ) as Record<string, { total: number; fez: number; pendentes: Set<string> }>

      aluno.entregas.forEach((entrega) => {
        const day = String(entrega.subLicao.licao.dataEnvio.getUTCDate())
        const item = porDiaComSet[day]

        if (!item) return

        item.total += 1
        if (entrega.status === "FEZ") {
          item.fez += 1
        } else {
          item.pendentes.add(entrega.subLicao.disciplina)
        }
      })

      const porDia = Object.fromEntries(
        Object.entries(porDiaComSet).map(([day, value]) => [
          day,
          {
            total: value.total,
            fez: value.fez,
            pendentes: Array.from(value.pendentes).sort((a, b) =>
              a.localeCompare(b, "pt-BR")
            ),
          },
        ])
      ) as Record<string, DiaResumo>

      const totalFez = aluno.entregas.filter((e) => e.status === "FEZ").length
      const totalGeral = aluno.entregas.length

      return {
        nome: aluno.nome,
        totalFez,
        totalGeral,
        porDia,
      }
    })

    const monthLabel = `${monthStart.getUTCFullYear()}-${String(monthStart.getUTCMonth() + 1).padStart(2, "0")}`

    return NextResponse.json({
      mes: monthLabel,
      dias: days,
      rows: resumoPorAluno,
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Erro ao buscar dados" }, { status: 500 })
  }
}


