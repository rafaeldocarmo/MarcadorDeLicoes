import { prisma } from "@/lib/prisma";
import Dashboard from "@/components/Dashboard";
import AlunoAnalyticsSection from "@/components/AlunoAnalyticsSection";
import LicoesList from "@/components/LicoesList";

type Aluno = {
  id: string;
  nome: string;
};

type Entrega = {
  alunoId: string;
  status: "FEZ" | "NAO_FEZ";
};

export default async function HomePage() {

  const alunos: Aluno[] = await prisma.aluno.findMany();
  const entregas: Entrega[] = await prisma.entregaSubLicao.findMany();

  // 🔥 Agrupar dados para o gráfico
  const resumoPorAluno = alunos.map((aluno: Aluno) => {
    // Filtrar entregas deste aluno
    const entregasAluno = entregas.filter(
      (e: Entrega) => e.alunoId === aluno.id
    );

    // Contar quantos fez e nao fez
    const fez = entregasAluno.filter((e: Entrega) => e.status === "FEZ").length;
    const naoFez = entregasAluno.filter((e: Entrega) => e.status === "NAO_FEZ").length;

    return {
      nome: aluno.nome,
      fez,
      naoFez,
    };
  });

  return (
    <div className="min-h-screen bg-muted/40 p-8">
      <div className="max-w-7xl mx-auto space-y-10">
        <h1 className="text-4xl font-bold">Dashboard</h1>


        <Dashboard initialData={resumoPorAluno} />

        <AlunoAnalyticsSection />

        <LicoesList />
      </div>
    </div>
  );
}
