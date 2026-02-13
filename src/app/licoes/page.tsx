import NovaLicaoForm from "./novaLicaoForm"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"

export default async function Page() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect("/")
  }

  const turma = await prisma.turma.findFirst({
    where: {
      userId: session.user.id,
    },
    select: {
      id: true,
      disciplinas: true,
      materiais: true,
    },
  })

  const totalLicoes = turma
    ? await prisma.licao.count({
        where: {
          turmaId: turma.id,
        },
      })
    : 0

  return (
    <NovaLicaoForm
      hasLicoes={totalLicoes > 0}
      disciplinas={turma?.disciplinas ?? []}
      materiais={turma?.materiais ?? []}
    />
  )
}
