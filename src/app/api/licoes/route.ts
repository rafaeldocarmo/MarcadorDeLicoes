// /pages/api/licoes.ts
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

type LicaoWhereInput = NonNullable<
  NonNullable<Parameters<typeof prisma.licao.findMany>[0]>["where"]
>;

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const url = new URL(req.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
    const pageSize = Math.max(1, parseInt(url.searchParams.get("pageSize") || "5", 10));
    const disciplina = url.searchParams.get("disciplina");
    const material = url.searchParams.get("material");

    const turma = await prisma.turma.findFirst({
      where: { userId: session.user.id },
      select: { disciplinas: true, materiais: true },
    });

    const where: LicaoWhereInput = {
      turma: {
        userId: session.user.id,
      },
    };

    if (disciplina || material) {
      where.subLicoes = {
        some: {
          ...(disciplina ? { disciplina } : {}),
          ...(material ? { material } : {}),
        },
      };
    }

    const total = await prisma.licao.count({ where });
    const items = await prisma.licao.findMany({
      where,
      include: { subLicoes: true },
      orderBy: { dataEnvio: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return NextResponse.json({
      items,
      totalPages: Math.ceil(total / pageSize),
      disciplinasDisponiveis: turma?.disciplinas ?? [],
      materiaisDisponiveis: turma?.materiais ?? [],
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro ao buscar lições" }, { status: 500 });
  }
}

