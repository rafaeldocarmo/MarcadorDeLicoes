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
