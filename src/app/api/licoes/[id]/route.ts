import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"

type SubLicaoInput = {
  id?: string
  disciplina: string
  material: string
  descricao: string
}

type AtualizarLicaoPayload = {
  dataEnvio: string
  dataEntrega: string
  subLicoes: SubLicaoInput[]
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { id } = await params
    const body = (await req.json()) as Partial<AtualizarLicaoPayload>
    const dataEnvio = body.dataEnvio
    const dataEntrega = body.dataEntrega
    const subLicoes = (body.subLicoes ?? []).filter(
      (sub) =>
        sub.disciplina?.trim() &&
        sub.material?.trim() &&
        sub.descricao?.trim()
    )

    if (!id || !dataEnvio || !dataEntrega || subLicoes.length === 0) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 })
    }

    const licao = await prisma.licao.findFirst({
      where: {
        id,
        turma: {
          userId: session.user.id,
        },
      },
      select: {
        id: true,
        turmaId: true,
        subLicoes: {
          select: { id: true },
        },
      },
    })

    if (!licao) {
      return NextResponse.json({ error: "Lição não encontrada" }, { status: 404 })
    }

    const existingIds = new Set(licao.subLicoes.map((s) => s.id))
    const submittedIds = new Set(
      subLicoes.map((s) => s.id).filter((id): id is string => Boolean(id))
    )

    for (const submittedId of submittedIds) {
      if (!existingIds.has(submittedId)) {
        return NextResponse.json({ error: "Sublição inválida" }, { status: 400 })
      }
    }

    const idsToDelete = Array.from(existingIds).filter((id) => !submittedIds.has(id))
    const toUpdate = subLicoes.filter(
      (sub): sub is SubLicaoInput & { id: string } => Boolean(sub.id)
    )
    const toCreate = subLicoes.filter((sub) => !sub.id)

    const alunos = await prisma.aluno.findMany({
      where: { turmaId: licao.turmaId },
      select: { id: true },
    })

    await prisma.$transaction(async (tx) => {
      await tx.licao.update({
        where: { id: licao.id },
        data: {
          dataEnvio: new Date(dataEnvio),
          dataEntrega: new Date(dataEntrega),
        },
      })

      for (const sub of toUpdate) {
        await tx.subLicao.update({
          where: { id: sub.id },
          data: {
            disciplina: sub.disciplina,
            material: sub.material,
            descricao: sub.descricao,
          },
        })
      }

      if (idsToDelete.length > 0) {
        await tx.entregaSubLicao.deleteMany({
          where: {
            subLicaoId: { in: idsToDelete },
          },
        })

        await tx.subLicao.deleteMany({
          where: {
            id: { in: idsToDelete },
          },
        })
      }

      if (toCreate.length > 0) {
        const createdSubs = await Promise.all(
          toCreate.map((sub) =>
            tx.subLicao.create({
              data: {
                disciplina: sub.disciplina,
                material: sub.material,
                descricao: sub.descricao,
                licaoId: licao.id,
              },
              select: { id: true },
            })
          )
        )

        if (alunos.length > 0) {
          await tx.entregaSubLicao.createMany({
            data: createdSubs.flatMap((sub) =>
              alunos.map((aluno) => ({
                alunoId: aluno.id,
                subLicaoId: sub.id,
                status: "NAO_FEZ" as const,
              }))
            ),
          })
        }
      }
    })

    return NextResponse.json({ id: licao.id })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Erro ao atualizar lição" }, { status: 500 })
  }
}
