import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import Dashboard from "@/components/Dashboard";
import AlunoAnalyticsSection from "@/components/AlunoAnalyticsSection";
import { Button } from "@/components/ui/button";
import { redirect } from "next/navigation";
import LicoesList from "@/components/LicoesList";

export default async function HomePage() {
  const licoes = await prisma.licao.findMany({
    orderBy: { createdAt: "desc" },
  });

  const alunos = await prisma.aluno.findMany();

  const entregas = await prisma.entregaSubLicao.findMany();

  // 🔥 Agrupar dados para o gráfico
  const resumoPorAluno = alunos.map((aluno) => {
    const entregasAluno = entregas.filter(
      (e) => e.alunoId === aluno.id
    );

    const fez = entregasAluno.filter(
      (e) => e.status === "FEZ"
    ).length;

    const naoFez = entregasAluno.filter(
      (e) => e.status === "NAO_FEZ"
    ).length;

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

        {/* 📚 Lista de lições */}
        {/* <div className="space-y-4">
          <div className="flex justify-between">
            <h2 className="text-2xl font-semibold">
              Lição recentes
            </h2>
            <Button><Link href='/licoes'>Criar nova Lição</Link></Button>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {licoes.map((licao) => (
              <Card
                key={licao.id}
                className="rounded-2xl hover:shadow-lg transition"
              >
                <CardContent className="p-6 flex justify-between items-center">
                  <div>
                    <p className="font-medium">
                      {licao.titulo}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(
                        licao.dataEnvio
                      ).toLocaleDateString()}
                    </p>
                  </div>

                  <Link
                    href={`/licoes/${licao.id}`}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    Ver detalhes →
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div> */}
        <LicoesList />
      </div>
    </div>
  );
}
