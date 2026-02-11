// /pages/api/licoes.ts
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const pageSize = parseInt(url.searchParams.get("pageSize") || "5");
  const search = url.searchParams.get("search") || "";
  const disciplina = url.searchParams.get("disciplina");
  const material = url.searchParams.get("material");

  const where: Prisma.LicaoWhereInput = {};

  if (search) where.titulo = { contains: search, mode: "insensitive" };
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

  return new Response(JSON.stringify({ items, totalPages: Math.ceil(total / pageSize) }), { status: 200 });
}
