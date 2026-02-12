import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const alunos = await prisma.aluno.findMany({
      select: { id: true, nome: true },
      orderBy: { nome: "asc" }
    })

    const entregas = await prisma.entregaSubLicao.findMany({
      select: { alunoId: true, status: true }
    })

    // Agrupar entregas por aluno
    const resumoPorAluno = alunos.map(aluno => {
      const entregasAluno = entregas.filter(e => e.alunoId === aluno.id)
      return {
        nome: aluno.nome,
        fez: entregasAluno.filter(e => e.status === "FEZ").length,
        naoFez: entregasAluno.filter(e => e.status === "NAO_FEZ").length
      }
    })

    return NextResponse.json(resumoPorAluno)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Erro ao buscar dados" }, { status: 500 })
  }
}
