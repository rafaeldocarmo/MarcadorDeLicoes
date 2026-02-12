import { prisma } from "@/lib/prisma"
import AlunoAnalyticsClient from "./AlunoAnalyticsClient"
import { authOptions } from "@/lib/auth"
import { getServerSession } from "next-auth"

export default async function AlunoAnalyticsSection() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return <AlunoAnalyticsClient alunos={[]} />
  }

  const alunos = await prisma.aluno.findMany({
    where: {
      turma: {
        userId: session.user.id,
      },
    },
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
