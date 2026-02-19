import AlunoAnalyticsSection from "@/components/AlunoAnalyticsSection";
import LicoesList from "@/components/LicoesList";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import Dashboard from "@/components/Dashboard";
import NovaTurmaForm from "@/components/NovaTurmaForm";
import { prisma } from "@/lib/prisma";
import LogoutButton from "@/components/logout-button";

export const dynamic = "force-dynamic";

export default async function HomePage() {

    const session = await getServerSession(authOptions)

    if(!session) redirect('/')

    const turma = await prisma.turma.findFirst({
      where: { userId: session.user.id },
      select: { id: true },
    })


  return (
    <div className="min-h-screen p-6 md:p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex items-center justify-between rounded-2xl border border-sky-100/80 bg-white/80 p-4 shadow-sm backdrop-blur-sm md:p-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-sky-700/80">Painel</p>
            <h1 className="text-2xl font-semibold text-slate-900 md:text-3xl">Marcador de Lições</h1>
          </div>
          <LogoutButton />
        </div>

        {!turma ? <NovaTurmaForm /> : 
        <>
          <section className="rounded-2xl border border-sky-100/80 bg-white/85 p-4 shadow-sm backdrop-blur-sm md:p-5">
            <Dashboard />
          </section>
          
          <section className="rounded-2xl border border-sky-100/80 bg-white/85 p-4 shadow-sm backdrop-blur-sm md:p-5">
            <AlunoAnalyticsSection />
          </section>

          <section className="rounded-2xl border border-sky-100/80 bg-white/85 p-4 shadow-sm backdrop-blur-sm md:p-5">
            <LicoesList />
          </section>
        </>
        }

      </div>
    </div>
  );
}
