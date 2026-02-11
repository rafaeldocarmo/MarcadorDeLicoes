import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const alunos = await prisma.aluno.findMany({
      select: {
        id: true,
        nome: true,
      },
      orderBy: {
        nome: "asc",
      },
    })

    return NextResponse.json(alunos)
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: "Erro ao buscar alunos" },
      { status: 500 }
    )
  }
}
