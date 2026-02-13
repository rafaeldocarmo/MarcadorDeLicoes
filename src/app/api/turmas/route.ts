import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

type TurmaPayload = {
  nome?: string
  alunos?: string[]
  disciplinas?: string[]
  materiais?: string[]
}

function normalizeList(values: string[] = []) {
  return Array.from(
    new Set(values.map((item) => item.trim()).filter((item) => item.length > 0))
  )
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 })
  }

  const body = (await req.json()) as TurmaPayload

  const nome = body.nome?.trim() ?? ""
  const alunos = normalizeList(body.alunos)
  const disciplinas = normalizeList(body.disciplinas)
  const materiais = normalizeList(body.materiais)

  if (!nome || !alunos.length || !disciplinas.length || !materiais.length) {
    return NextResponse.json({ error: "Dados invalidos" }, { status: 400 })
  }

  const turma = await prisma.turma.create({
    data: {
      nome,
      userId: session.user.id,
      disciplinas,
      materiais,
      alunos: {
        create: alunos.map((nomeAluno: string) => ({
          nome: nomeAluno,
        })),
      },
    },
    include: {
      alunos: true,
    },
  })

  return NextResponse.json(turma)
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 })
  }

  const body = (await req.json()) as TurmaPayload

  const nome = body.nome?.trim() ?? ""
  const alunos = normalizeList(body.alunos)
  const disciplinas = normalizeList(body.disciplinas)
  const materiais = normalizeList(body.materiais)

  if (!nome || !alunos.length || !disciplinas.length || !materiais.length) {
    return NextResponse.json({ error: "Dados invalidos" }, { status: 400 })
  }

  const turma = await prisma.turma.findFirst({
    where: { userId: session.user.id },
    include: { alunos: { select: { nome: true } } },
  })

  if (!turma) {
    return NextResponse.json({ error: "Turma nao encontrada" }, { status: 404 })
  }

  const nomesAtuais = new Set(turma.alunos.map((aluno: { nome: string }) => aluno.nome))
  const alunosParaCriar = alunos.filter((nomeAluno: string) => !nomesAtuais.has(nomeAluno))

  const turmaAtualizada = await prisma.turma.update({
    where: { id: turma.id },
    data: {
      nome,
      disciplinas,
      materiais,
      alunos: {
        create: alunosParaCriar.map((nomeAluno: string) => ({ nome: nomeAluno })),
      },
    },
    include: { alunos: true },
  })

  return NextResponse.json(turmaAtualizada)
}
