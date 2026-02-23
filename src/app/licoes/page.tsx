import NovaLicaoForm from "./novaLicaoForm"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { GlobalRole, TurmaRole } from "@prisma/client"

type SearchParamsInput =
  | Promise<{ dataEntrega?: string; turmaId?: string }>
  | { dataEntrega?: string; turmaId?: string }
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

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { globalRole: true },
  })

  if (!user) {
    redirect("/")
  }

  const resolvedSearchParams = searchParams ? await Promise.resolve(searchParams) : undefined
  const requestedTurmaId = resolvedSearchParams?.turmaId?.trim() ?? ""

  const turma = await prisma.turma.findFirst({
    where: requestedTurmaId
      ? {
          id: requestedTurmaId,
          ...(user.globalRole === GlobalRole.ADMIN_GLOBAL
            ? {}
            : {
                OR: [
                  { ownerId: session.user.id },
                  {
                    members: {
                      some: {
                        userId: session.user.id,
                        role: {
                          in: [TurmaRole.OWNER, TurmaRole.EDITOR],
                        },
                      },
                    },
                  },
                ],
              }),
        }
      : {
          OR: [
            { ownerId: session.user.id },
            {
              members: {
                some: {
                  userId: session.user.id,
                  role: {
                    in: [TurmaRole.OWNER, TurmaRole.EDITOR],
                  },
                },
              },
            },
          ],
        },
    select: {
      id: true,
      disciplinas: true,
      materiais: true,
    },
    orderBy: [{ createdAt: "desc" }],
  })

  const totalLicoes = turma
    ? await prisma.licao.count({
        where: {
          turmaId: turma.id,
        },
      })
    : 0

  const initialDataEntrega = getDataEntregaFromQuery(resolvedSearchParams?.dataEntrega)

  return (
    <NovaLicaoForm
      hasLicoes={totalLicoes > 0}
      disciplinas={turma?.disciplinas ?? []}
      materiais={turma?.materiais ?? []}
      initialDataEntrega={initialDataEntrega}
      turmaId={turma?.id}
    />
  )
}
