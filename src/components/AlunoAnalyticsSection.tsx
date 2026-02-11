import { prisma } from "@/lib/prisma"
import AlunoAnalyticsClient from "./AlunoAnalyticsClient"

export default async function AlunoAnalyticsSection() {
  const alunos = await prisma.aluno.findMany({
    select: {
      id: true,
      nome: true,
    },
    orderBy: {
      nome: "asc",
    },
  })

  return <AlunoAnalyticsClient alunos={alunos} />
}