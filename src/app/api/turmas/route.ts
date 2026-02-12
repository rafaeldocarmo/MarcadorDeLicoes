import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  const body = await req.json()

  const { nome, alunos } = body

  if (!nome || !alunos?.length) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 })
  }

  const turma = await prisma.turma.create({
    data: {
      nome,
      userId: session.user.id,
      alunos: {
        create: alunos.map((nome: string) => ({
          nome
        }))
      }
    },
    include: {
      alunos: true
    }
  })

  return NextResponse.json(turma)
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: "NÃ£o autorizado" }, { status: 401 })
  }

  const body = await req.json()
  const { nome, alunos } = body

  if (!nome || !alunos?.length) {
    return NextResponse.json({ error: "Dados invÃ¡lidos" }, { status: 400 })
  }

  const turma = await prisma.turma.findFirst({
    where: { userId: session.user.id },
    include: { alunos: { select: { nome: true } } },
  })

  if (!turma) {
    return NextResponse.json({ error: "Turma nÃ£o encontrada" }, { status: 404 })
  }

  const alunosNormalizados: string[] = Array.from(
    new Set(
      (alunos as string[])
        .map((aluno: string) => aluno.trim())
        .filter((aluno: string) => aluno.length > 0)
    )
  )

  const nomesAtuais = new Set(turma.alunos.map((aluno: { nome: string }) => aluno.nome))
  const alunosParaCriar = alunosNormalizados.filter((nomeAluno: string) => !nomesAtuais.has(nomeAluno))

  const turmaAtualizada = await prisma.turma.update({
    where: { id: turma.id },
    data: {
      nome,
      alunos: {
        create: alunosParaCriar.map((nomeAluno: string) => ({ nome: nomeAluno })),
      },
    },
    include: { alunos: true },
  })

  return NextResponse.json(turmaAtualizada)
}
