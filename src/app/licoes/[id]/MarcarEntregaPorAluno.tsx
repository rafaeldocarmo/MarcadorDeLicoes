"use client";

import { useState, useTransition } from "react";
import { redirect } from "next/navigation";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { format } from "date-fns";
import { BookOpen, FileText, Layers } from "lucide-react";

type Status = "FEZ" | "NAO_FEZ" | "FALTA";

type Aluno = {
  id: string;
  nome: string;
};

type SubLicao = {
  id: string;
  disciplina: string;
  material: string;
  descricao?: string;
};

type Licao = {
  id: string;
  dataEnvio: Date | string;
  dataEntrega: Date | string;
  turma: {
    alunos: Aluno[];
  };
  subLicoes: SubLicao[];
};

type Entrega = {
  alunoId: string;
  subLicaoId: string;
  status: Status;
};

type Props = {
  licao: Licao;
  entregas: Entrega[];
};

function formatDateBr(value: Date | string) {
  const parsed = value instanceof Date ? value : new Date(value);
  return format(parsed, "dd/MM/yyyy");
}

export default function MarcarEntregaPorAluno({
  licao,
  entregas,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [shouldRedirectHome, setShouldRedirectHome] = useState(false);

  if (shouldRedirectHome) {
    redirect("/home");
  }

  const [estadoEntregas, setEstadoEntregas] = useState(() => {
    const map = new Map<string, Status>();

    for (const entrega of entregas) {
      map.set(
        `${entrega.alunoId}-${entrega.subLicaoId}`,
        entrega.status
      );
    }

    return map;
  });

  const [faltasPorAluno, setFaltasPorAluno] = useState(() => {
    const faltas = new Set<string>();

    for (const aluno of licao.turma.alunos) {
      const todosFalta = licao.subLicoes.every((sub) => {
        const key = `${aluno.id}-${sub.id}`;
        return estadoEntregas.get(key) === "FALTA";
      });

      if (todosFalta && licao.subLicoes.length > 0) {
        faltas.add(aluno.id);
      }
    }

    return faltas;
  });

  function toggleStatus(
    alunoId: string,
    subLicaoId: string,
    checked: boolean
  ) {
    const key = `${alunoId}-${subLicaoId}`;

    setEstadoEntregas((prev: Map<string, Status>) => {
      const newMap = new Map<string, Status>(prev);
      newMap.set(key, checked ? "FEZ" : "NAO_FEZ");
      return newMap;
    });
  }

  function toggleFaltaAluno(alunoId: string, checked: boolean) {
    setFaltasPorAluno((prev) => {
      const next = new Set(prev);
      if (checked) next.add(alunoId);
      else next.delete(alunoId);
      return next;
    });

    setEstadoEntregas((prev: Map<string, Status>) => {
      const newMap = new Map<string, Status>(prev);

      for (const sub of licao.subLicoes) {
        const key = `${alunoId}-${sub.id}`;
        newMap.set(key, checked ? "FALTA" : "NAO_FEZ");
      }

      return newMap;
    });
  }

  function handleSalvar() {
    const payload: Entrega[] = Array.from(estadoEntregas.entries()).map(
      ([key, status]: [string, Status]): Entrega => {
        const [alunoId, subLicaoId] = key.split("-");
        return { alunoId, subLicaoId, status };
      }
    );

    startTransition(async () => {
      const res = await fetch("/api/salvar-entregas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          licaoId: licao.id,
          entregas: payload,
        }),
      });

      if (!res.ok) return;
      setShouldRedirectHome(true);
    });
  }

  return (
    <div className="min-h-screen bg-muted/40 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">
          {formatDateBr(licao.dataEnvio)} - {formatDateBr(licao.dataEntrega)}
        </h1>

        <section className="rounded-3xl border border-border/70 bg-gradient-to-b from-background to-muted/20 p-4 shadow-sm md:p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Lições
            </h2>
            <span className="rounded-full border border-border/70 bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
              {licao.subLicoes.length} itens
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {licao.subLicoes.map((sub: SubLicao, index: number) => (
              <article
                key={sub.id}
                className="group rounded-2xl border border-border/70 bg-background p-4 shadow-[0_1px_0_rgba(0,0,0,0.03)] transition-all hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-md"
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
                    Lição {index + 1}
                  </span>
                </div>

                <div className="space-y-2.5">
                  <div className="flex items-start gap-2">
                    <BookOpen className="mt-0.5 h-4 w-4 text-primary/80" />
                    <div>
                      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Disciplina</p>
                      <p className="text-sm font-semibold text-foreground">{sub.disciplina}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <Layers className="mt-0.5 h-4 w-4 text-primary/80" />
                    <div>
                      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Material</p>
                      <p className="text-sm font-medium text-foreground">{sub.material}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <FileText className="mt-0.5 h-4 w-4 text-primary/80" />
                    <div>
                      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Descricao</p>
                      <p className="line-clamp-3 text-sm text-muted-foreground">
                        {sub.descricao?.trim() ? sub.descricao : "Sem descricao informada."}
                      </p>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <div className="border rounded-2xl overflow-hidden bg-background">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-4">Aluno</th>
                <th className="p-4 text-center">
                  <div className="font-medium text-yellow-700">FA</div>
                  <div className="text-xs text-muted-foreground">Falta na lição</div>
                </th>
                {licao.subLicoes.map((sub: SubLicao) => (
                  <th key={sub.id} className="p-4 text-center">
                    <div className="font-medium">
                      {sub.disciplina}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {sub.material}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {licao.turma.alunos.map((aluno: Aluno) => (
                <tr
                  key={aluno.id}
                  className="border-t hover:bg-muted/30 transition"
                >
                  <td className="p-4 font-medium">
                    {aluno.nome}
                  </td>

                  <td className="p-4 text-center">
                    <Switch
                      checked={faltasPorAluno.has(aluno.id)}
                      disabled={isPending}
                      onCheckedChange={(checked) =>
                        toggleFaltaAluno(aluno.id, checked)
                      }
                    />
                  </td>

                  {licao.subLicoes.map((sub: SubLicao) => {
                    const key = `${aluno.id}-${sub.id}`;
                    const status = estadoEntregas.get(key);

                    return (
                      <td
                        key={sub.id}
                        className="p-4 text-center"
                      >
                        <Switch
                          checked={status === "FEZ"}
                          disabled={isPending || faltasPorAluno.has(aluno.id)}
                          onCheckedChange={(checked) =>
                            toggleStatus(
                              aluno.id,
                              sub.id,
                              checked
                            )
                          }
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="flex justify-between">
          <Button className="rounded-2xl px-6" variant="outline">
            <Link href="/home">Voltar para Home</Link>
          </Button>
          <div className="flex gap-2">
            <Button asChild className="rounded-2xl px-6" variant="outline">
              <Link href={`/licoes/${licao.id}/editar`}>Editar lição</Link>
            </Button>
            <Button
              onClick={handleSalvar}
              disabled={isPending}
              className="rounded-2xl px-6"
            >
              {isPending ? "Salvando..." : "Salvar alterações"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

