import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const alunoId = searchParams.get("id")

  if (!alunoId) {
    return NextResponse.json(
      { error: "Aluno não informado" },
      { status: 400 }
    )
  }

  // Buscar entregas do aluno
  const entregas = await prisma.entregaSubLicao.findMany({
    where: {
      alunoId,
    },
    include: {
      subLicao: {
        include: {
          licao: true,
        },
      },
    },
    orderBy: {
      subLicao: {
        licao: {
          dataEnvio: "asc",
        },
      },
    },
  })

  // =============================
  // 1️⃣ TIMELINE POR DIA
  // =============================

  const timelineMap: Record<
    string,
    {
      data: string
      fez: number
      naoFez: number
      disciplinasFez: Set<string>
      disciplinasNaoFez: Set<string>
    }
  > = {}

  entregas.forEach((entrega: typeof entregas[number]) => {
    const dataEnvio = entrega.subLicao.licao.dataEnvio
      .toISOString()
      .split("T")[0]

    if (!timelineMap[dataEnvio]) {
      timelineMap[dataEnvio] = {
        data: dataEnvio,
        fez: 0,
        naoFez: 0,
        disciplinasFez: new Set<string>(),
        disciplinasNaoFez: new Set<string>(),
      }
    }

    const disciplina = entrega.subLicao.disciplina

    if (entrega.status === "FEZ") {
      timelineMap[dataEnvio].fez++
      timelineMap[dataEnvio].disciplinasFez.add(disciplina)
    } else {
      timelineMap[dataEnvio].naoFez++
      timelineMap[dataEnvio].disciplinasNaoFez.add(disciplina)
    }
  })


  const timeline = Object.values(timelineMap).map((item) => ({
    data: item.data,
    fez: item.fez,
    naoFez: item.naoFez,
    disciplinasFez: Array.from(item.disciplinasFez),
    disciplinasNaoFez: Array.from(item.disciplinasNaoFez),
  }))

  // =============================
  // 2️⃣ PERFORMANCE POR DISCIPLINA
  // =============================

  const disciplinaMap: Record<
    string,
    { disciplina: string; fez: number; naoFez: number }
  > = {}

  entregas.forEach((entrega: typeof entregas[number]) => {
    const disciplina = entrega.subLicao.disciplina

    if (!disciplinaMap[disciplina]) {
      disciplinaMap[disciplina] = {
        disciplina,
        fez: 0,
        naoFez: 0,
      }
    }

    if (entrega.status === "FEZ") {
      disciplinaMap[disciplina].fez++
    } else {
      disciplinaMap[disciplina].naoFez++
    }
  })

  const disciplinas = Object.values(disciplinaMap)

  // =============================
  // 3️⃣ RESUMO GERAL
  // =============================

  const geral = entregas.reduce(
    (acc: { fez: number; naoFez: number }, entrega: typeof entregas[number]) => {
      if (entrega.status === "FEZ") acc.fez++
      else acc.naoFez++
      return acc
    },
    { fez: 0, naoFez: 0 }
  )

  return NextResponse.json({
    timeline,
    disciplinas,
    geral,
  })
}
