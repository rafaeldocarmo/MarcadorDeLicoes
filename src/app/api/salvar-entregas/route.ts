import { prisma } from "@/lib/prisma";
import { StatusEntrega } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { ApiError, errorResponse, requireAuthenticatedActor } from "@/lib/api-auth";
import { turmaWhereByPermission } from "@/lib/rbac";

type Status = "FEZ" | "NAO_FEZ" | "FALTA";

type EntregaPayload = {
  alunoId: string;
  subLicaoId: string;
  status: Status;
};

type SalvarEntregasPayload = {
  licaoId: string;
  entregas: EntregaPayload[];
};

export async function POST(req: Request) {
  try {
    const actor = await requireAuthenticatedActor();

    const body = (await req.json()) as Partial<SalvarEntregasPayload>;
    const licaoId = body.licaoId?.trim() ?? "";
    const entregas = body.entregas ?? [];
    const statusPermitidos = new Set<string>(Object.values(StatusEntrega));
    const recebeuFalta = entregas.some((entrega) => entrega?.status === "FALTA");

    if (recebeuFalta && !statusPermitidos.has("FALTA")) {
      throw new ApiError(
        "Status 'FALTA' não está disponível no banco ainda. Rode a migration e regenere o Prisma Client.",
        409
      );
    }

    if (!licaoId || !Array.isArray(entregas)) {
      throw new ApiError("Dados inválidos", 400);
    }

    const licao = await prisma.licao.findFirst({
      where: {
        id: licaoId,
        turma: turmaWhereByPermission(actor, "EDIT_TURMA"),
      },
      select: {
        id: true,
        subLicoes: {
          select: { id: true },
        },
        turma: {
          select: {
            alunos: {
              select: { id: true },
            },
          },
        },
      },
    });

    if (!licao) {
      throw new ApiError("Lição não encontrada ou sem acesso", 404);
    }

    const alunosValidos = new Set(licao.turma.alunos.map((aluno) => aluno.id));
    const subLicoesValidas = new Set(licao.subLicoes.map((sub) => sub.id));

    const entregasFiltradas = entregas.filter(
      (entrega): entrega is EntregaPayload =>
        statusPermitidos.has(entrega.status) &&
        alunosValidos.has(entrega.alunoId) &&
        subLicoesValidas.has(entrega.subLicaoId)
    );

    if (entregasFiltradas.length > 0) {
      await prisma.$transaction(
        entregasFiltradas.map((entrega) =>
          prisma.entregaSubLicao.upsert({
            where: {
              alunoId_subLicaoId: {
                alunoId: entrega.alunoId,
                subLicaoId: entrega.subLicaoId,
              },
            },
            update: { status: entrega.status },
            create: {
              alunoId: entrega.alunoId,
              subLicaoId: entrega.subLicaoId,
              status: entrega.status,
            },
          })
        )
      );
    }

    revalidatePath(`/licoes/${licao.id}`);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error, "Erro ao salvar entregas");
  }
}
