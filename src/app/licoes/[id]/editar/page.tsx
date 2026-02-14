import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { notFound, redirect } from "next/navigation"
import NovaLicaoForm from "../../novaLicaoForm"

export default async function EditarLicaoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    redirect("/")
  }

  const { id } = await params
  if (!id) notFound()

  const licao = await prisma.licao.findFirst({
    where: {
      id,
      turma: {
        userId: session.user.id,
      },
    },
    include: {
      subLicoes: {
        orderBy: { id: "asc" },
      },
      turma: {
        select: {
          disciplinas: true,
          materiais: true,
        },
      },
    },
  })

  if (!licao) notFound()

  return (
    <NovaLicaoForm
      hasLicoes
      disciplinas={licao.turma.disciplinas}
      materiais={licao.turma.materiais}
      mode="edit"
      licaoId={licao.id}
      initialDataEnvio={licao.dataEnvio.toISOString()}
      initialDataEntrega={licao.dataEntrega.toISOString()}
      initialSubLicoes={licao.subLicoes.map((sub) => ({
        id: sub.id,
        disciplina: sub.disciplina,
        material: sub.material,
        descricao: sub.descricao,
      }))}
    />
  )
}
