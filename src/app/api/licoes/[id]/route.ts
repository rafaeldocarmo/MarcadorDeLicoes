import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { ApiError, errorResponse, requireAuthenticatedActor } from "@/lib/api-auth";
import { turmaWhereByPermission } from "@/lib/rbac";

type SubLicaoInput = {
  id?: string;
  disciplina: string;
  material: string;
  descricao: string;
};

type AtualizarLicaoPayload = {
  dataEnvio: string;
  dataEntrega: string;
  subLicoes: SubLicaoInput[];
};

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const actor = await requireAuthenticatedActor();
    const { id } = await params;

    const body = (await req.json()) as Partial<AtualizarLicaoPayload>;
    const dataEnvio = body.dataEnvio;
    const dataEntrega = body.dataEntrega;
    const subLicoes = (body.subLicoes ?? []).filter(
      (sub) => sub.disciplina?.trim() && sub.material?.trim() && sub.descricao?.trim()
    );

    if (!id || !dataEnvio || !dataEntrega || subLicoes.length === 0) {
      throw new ApiError("Dados inválidos", 400);
    }

    const licao = await prisma.licao.findFirst({
      where: {
        id,
        turma: turmaWhereByPermission(actor, "EDIT_TURMA"),
      },
      select: {
        id: true,
        turmaId: true,
        subLicoes: {
          select: { id: true },
        },
      },
    });

    if (!licao) {
      throw new ApiError("Lição não encontrada ou sem acesso", 404);
    }

    const existingIds = new Set(licao.subLicoes.map((s) => s.id));
    const submittedIds = new Set(subLicoes.map((s) => s.id).filter((subId): subId is string => Boolean(subId)));

    for (const submittedId of submittedIds) {
      if (!existingIds.has(submittedId)) {
        throw new ApiError("Sublição inválida", 400);
      }
    }

    const idsToDelete = Array.from(existingIds).filter((subId) => !submittedIds.has(subId));
    const toUpdate = subLicoes.filter((sub): sub is SubLicaoInput & { id: string } => Boolean(sub.id));
    const toCreate = subLicoes.filter((sub) => !sub.id);

    const alunos = await prisma.aluno.findMany({
      where: { turmaId: licao.turmaId },
      select: { id: true },
    });

    await prisma.$transaction(async (tx) => {
      await tx.licao.update({
        where: { id: licao.id },
        data: {
          dataEnvio: new Date(dataEnvio),
          dataEntrega: new Date(dataEntrega),
        },
      });

      for (const sub of toUpdate) {
        await tx.subLicao.update({
          where: { id: sub.id },
          data: {
            disciplina: sub.disciplina,
            material: sub.material,
            descricao: sub.descricao,
          },
        });
      }

      if (idsToDelete.length > 0) {
        await tx.entregaSubLicao.deleteMany({
          where: {
            subLicaoId: { in: idsToDelete },
          },
        });

        await tx.subLicao.deleteMany({
          where: {
            id: { in: idsToDelete },
          },
        });
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
        );

        if (alunos.length > 0) {
          await tx.entregaSubLicao.createMany({
            data: createdSubs.flatMap((sub) =>
              alunos.map((aluno) => ({
                alunoId: aluno.id,
                subLicaoId: sub.id,
                status: "NAO_FEZ" as const,
              }))
            ),
          });
        }
      }
    });

    return NextResponse.json({ id: licao.id });
  } catch (error) {
    return errorResponse(error, "Erro ao atualizar lição");
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const actor = await requireAuthenticatedActor();
    const { id } = await params;

    if (!id) {
      throw new ApiError("Dados inválidos", 400);
    }

    const licao = await prisma.licao.findFirst({
      where: {
        id,
        turma: turmaWhereByPermission(actor, "EDIT_TURMA"),
      },
      select: {
        id: true,
        subLicoes: {
          select: { id: true },
        },
      },
    });

    if (!licao) {
      throw new ApiError("Lição não encontrada ou sem acesso", 404);
    }

    const subLicaoIds = licao.subLicoes.map((sub) => sub.id);

    await prisma.$transaction(async (tx) => {
      if (subLicaoIds.length > 0) {
        await tx.entregaSubLicao.deleteMany({
          where: {
            subLicaoId: {
              in: subLicaoIds,
            },
          },
        });

        await tx.subLicao.deleteMany({
          where: {
            id: {
              in: subLicaoIds,
            },
          },
        });
      }

      await tx.licao.delete({
        where: { id: licao.id },
      });
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error, "Erro ao apagar lição");
  }
}
