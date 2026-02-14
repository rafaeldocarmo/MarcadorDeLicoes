import NovaLicaoForm from "./novaLicaoForm"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"

type SearchParamsInput =
  | Promise<{ dataEntrega?: string }>
  | { dataEntrega?: string }
  | undefined

function getDataEntregaFromQuery(value: string | undefined) {
  if (!value) return undefined
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : undefined
}

export default async function Page({ searchParams }: { searchParams?: SearchParamsInput }) {
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

  const resolvedSearchParams = searchParams ? await Promise.resolve(searchParams) : undefined
  const initialDataEntrega = getDataEntregaFromQuery(resolvedSearchParams?.dataEntrega)

  return (
    <NovaLicaoForm
      hasLicoes={totalLicoes > 0}
      disciplinas={turma?.disciplinas ?? []}
      materiais={turma?.materiais ?? []}
      initialDataEntrega={initialDataEntrega}
    />
  )
}
