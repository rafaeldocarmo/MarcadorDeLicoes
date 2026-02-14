"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { format } from "date-fns";

type Status = "FEZ" | "NAO_FEZ";

type Aluno = {
  id: string;
  nome: string;
};

type SubLicao = {
  id: string;
  disciplina: string;
  material: string;
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
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

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
      router.refresh();
    });
  }

  return (
    <div className="min-h-screen bg-muted/40 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">
          {formatDateBr(licao.dataEnvio)} - {formatDateBr(licao.dataEntrega)}
        </h1>

        <div className="border rounded-2xl overflow-hidden bg-background">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-4">Aluno</th>
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
                          disabled={isPending}
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


