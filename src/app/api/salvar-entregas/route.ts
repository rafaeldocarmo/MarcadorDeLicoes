import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

type Status = "FEZ" | "NAO_FEZ";

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
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    const body = (await req.json()) as Partial<SalvarEntregasPayload>;
    const licaoId = body.licaoId?.trim() ?? "";
    const entregas = body.entregas ?? [];

    if (!licaoId || !Array.isArray(entregas)) {
      return NextResponse.json({ error: "Dados invalidos" }, { status: 400 });
    }

    const licao = await prisma.licao.findFirst({
      where: {
        id: licaoId,
        turma: {
          userId: session.user.id,
        },
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
      return NextResponse.json({ error: "Licao nao encontrada" }, { status: 404 });
    }

    const alunosValidos = new Set(licao.turma.alunos.map((aluno) => aluno.id));
    const subLicoesValidas = new Set(licao.subLicoes.map((sub) => sub.id));

    const entregasFiltradas = entregas.filter(
      (entrega): entrega is EntregaPayload =>
        (entrega.status === "FEZ" || entrega.status === "NAO_FEZ") &&
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
    console.error(error);
    return NextResponse.json({ error: "Erro ao salvar entregas" }, { status: 500 });
  }
}
