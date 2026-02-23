import AlunoAnalyticsSection from "@/components/AlunoAnalyticsSection";
import LicoesList from "@/components/LicoesList";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import Dashboard from "@/components/Dashboard";
import { prisma } from "@/lib/prisma";
import LogoutButton from "@/components/logout-button";
import HomeTurmaSelect from "@/components/HomeTurmaSelect";
import { GlobalRole, TurmaRole } from "@prisma/client";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

type SearchParamsInput =
  | Promise<{ turmaId?: string }>
  | { turmaId?: string }
  | undefined;

export default async function HomePage({
  searchParams,
}: {
  searchParams?: SearchParamsInput;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) redirect("/");

  const resolvedSearchParams = searchParams ? await Promise.resolve(searchParams) : undefined;
  const requestedTurmaId = resolvedSearchParams?.turmaId?.trim();

  const actor = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { globalRole: true },
  });

  if (!actor) redirect("/");

  const isGlobalAdmin = actor.globalRole === GlobalRole.ADMIN_GLOBAL;

  const turmas = await prisma.turma.findMany({
    where: isGlobalAdmin
      ? {}
      : {
          OR: [
            { ownerId: session.user.id },
            {
              members: {
                some: {
                  userId: session.user.id,
                },
              },
            },
          ],
        },
    select: {
      id: true,
      nome: true,
      ownerId: true,
      members: {
        where: {
          userId: session.user.id,
        },
        select: {
          role: true,
        },
        take: 1,
      },
    },
    orderBy: [{ createdAt: "desc" }],
  });

  const hasRequested = requestedTurmaId
    ? turmas.some((turma) => turma.id === requestedTurmaId)
    : false;
  const selectedTurmaId = hasRequested ? (requestedTurmaId as string) : (turmas[0]?.id ?? "");
  const selectedTurma = turmas.find((turma) => turma.id === selectedTurmaId);
  const hasOwnedTurma = turmas.some((turma) => turma.ownerId === session.user.id);

  const selectedRole =
    isGlobalAdmin
      ? "ADMIN_GLOBAL"
      : selectedTurma?.ownerId === session.user.id
        ? TurmaRole.OWNER
        : (selectedTurma?.members[0]?.role ?? TurmaRole.VIEWER);

  const canEditSala =
    selectedRole === "ADMIN_GLOBAL" ||
    selectedRole === TurmaRole.OWNER ||
    selectedRole === TurmaRole.EDITOR;
  const canCreateLicao = canEditSala;

  return (
    <div className="min-h-screen p-6 md:p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-sky-100/80 bg-white/80 p-4 shadow-sm backdrop-blur-sm md:p-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-sky-700/80">Painel</p>
            <h1 className="text-2xl font-semibold text-slate-900 md:text-3xl">Marcador de Lições</h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {turmas.length > 1 ? (
              <HomeTurmaSelect
                selectedTurmaId={selectedTurmaId}
                turmas={turmas.map((turma) => ({ id: turma.id, nome: turma.nome }))}
              />
            ) : null}
            {!hasOwnedTurma ? (
              <Button asChild variant="outline">
                <Link href="/home/criar-sala">Criar minha sala</Link>
              </Button>
            ) : null}
            <LogoutButton />
          </div>
        </div>

        {turmas.length === 0 ? (
          <section className="rounded-2xl border border-sky-100/80 bg-white/85 p-6 shadow-sm backdrop-blur-sm md:p-8">
            <h2 className="text-lg font-semibold text-slate-900">Você ainda não tem acesso a nenhuma sala.</h2>
            <p className="mt-2 text-sm text-slate-600">
              Você pode criar uma sala agora ou pedir para o dono de uma sala te adicionar com permissão de
              visualização ou edição.
            </p>
            <div className="mt-4">
              <Button asChild>
                <Link href="/home/criar-sala">Criar uma sala</Link>
              </Button>
            </div>
          </section>
        ) : (
          <>
            <section className="rounded-2xl border border-sky-100/80 bg-white/85 p-4 shadow-sm backdrop-blur-sm md:p-5">
              <Dashboard turmaId={selectedTurmaId} canEditSala={canEditSala} />
            </section>

            <section className="rounded-2xl border border-sky-100/80 bg-white/85 p-4 shadow-sm backdrop-blur-sm md:p-5">
              <AlunoAnalyticsSection turmaId={selectedTurmaId} />
            </section>

            <section className="rounded-2xl border border-sky-100/80 bg-white/85 p-4 shadow-sm backdrop-blur-sm md:p-5">
              <LicoesList turmaId={selectedTurmaId} canCreateLicao={canCreateLicao} />
            </section>
          </>
        )}
      </div>
    </div>
  );
}
