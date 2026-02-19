import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"
import { getServerSession } from "next-auth"
import { NextRequest, NextResponse } from "next/server"

type DiaResumo = {
  total: number
  fez: number
  falta: number
  pendentes: string[]
}

type ResumoAlunoItem = {
  nome: string
  totalFez: number
  totalGeral: number
  porDia: Record<string, DiaResumo>
}

type DiaColuna = {
  key: string
  label: number
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
  const days: DiaColuna[] = []
  const cursor = new Date(
    Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate(), 0, 0, 0, 0)
  )
  const end = new Date(
    Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate(), 0, 0, 0, 0)
  )

  while (cursor.getTime() <= end.getTime()) {
    days.push({
      key: cursor.toISOString().split("T")[0],
      label: cursor.getUTCDate(),
    })
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
                dataEntrega: {
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
                    dataEntrega: true,
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
          day.key,
          { total: 0, fez: 0, falta: 0, pendentes: new Set<string>() },
        ])
      ) as Record<string, { total: number; fez: number; falta: number; pendentes: Set<string> }>

      aluno.entregas.forEach((entrega) => {
        const day = entrega.subLicao.licao.dataEntrega.toISOString().split("T")[0]
        const item = porDiaComSet[day]

        if (!item) return

        item.total += 1
        if (entrega.status === "FEZ") {
          item.fez += 1
        } else if (entrega.status === "FALTA") {
          item.falta += 1
          item.pendentes.add(entrega.subLicao.disciplina)
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
            falta: value.falta,
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


