"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Licao = {
  id: string;
  titulo: string;
  dataEnvio: string;
  subLicoes: {
    disciplina: string;
    material: string;
  }[];
};

type Props = {
  pageSize?: number;
};

type LicoesApiResponse = {
  items: Licao[];
  totalPages: number;
};

export default function LicoesList({ pageSize = 6 }: Props) {
  const [licoes, setLicoes] = useState<Licao[]>([]);
  const [search, setSearch] = useState("");
  const [disciplinaFilter, setDisciplinaFilter] = useState<string | undefined>();
  const [materialFilter, setMaterialFilter] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // 🔹 Buscar lições do backend via API
  useEffect(() => {
    async function fetchLicoes() {
      const params = new URLSearchParams();
      params.append("page", page.toString());
      params.append("pageSize", pageSize.toString());
      if (search) params.append("search", search);
      if (disciplinaFilter) params.append("disciplina", disciplinaFilter);
      if (materialFilter) params.append("material", materialFilter);

      const res = await fetch(`/api/licoes?${params.toString()}`);
      if (!res.ok) {
        setLicoes([]);
        setTotalPages(1);
        return;
      }

      const data: LicoesApiResponse = await res.json();
      setLicoes(data.items);
      setTotalPages(data.totalPages);
    }
    fetchLicoes();
  }, [page, pageSize, search, disciplinaFilter, materialFilter]);

  return (
    <div className="space-y-4">
      {/* Header + Filtros */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h2 className="text-2xl font-semibold">Lições</h2>
        <Button>
            <Link href="/licoes">Criar nova Lição</Link>
          </Button>
      </div>
        <div className="flex flex-wrap gap-2 items-center justify-end">
          <Input
            placeholder="Buscar por título..."
            value={search}
            onChange={(e) => { setPage(1); setSearch(e.target.value); }}
            className="w-48"
          />

            <Select onValueChange={(v) => { setPage(1); setDisciplinaFilter(v === "ALL" ? undefined : v); }}>
                <SelectTrigger className="w-40">
                    <SelectValue placeholder="Filtrar por disciplina" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="ALL">Todas</SelectItem>
                    <SelectItem value="Matemática">Matemática</SelectItem>
                    <SelectItem value="Português">Português</SelectItem>
                    <SelectItem value="História">História</SelectItem>
                    <SelectItem value="Ciências">Ciências</SelectItem>
                </SelectContent>
            </Select>


            <Select onValueChange={(v) => { setPage(1); setMaterialFilter(v === "ALL" ? undefined : v); }}>
                <SelectTrigger className="w-40">
                    <SelectValue placeholder="Filtrar por material" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="ALL">Todos</SelectItem>
                    <SelectItem value="Livro">Livro</SelectItem>
                    <SelectItem value="Vídeo">Vídeo</SelectItem>
                    <SelectItem value="Exercício">Exercício</SelectItem>
                </SelectContent>
            </Select>


          
        </div>

      {/* Lista de lições */}
      <div className="grid md:grid-cols-2 gap-4">
        {licoes.map((licao: Licao) => (
          <Card key={licao.id} className="rounded-2xl hover:shadow-lg transition">
            <CardContent className="p-6 flex justify-between items-center">
              <div>
                <p className="font-medium">{licao.titulo}</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(licao.dataEnvio).toLocaleDateString()}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {licao.subLicoes.map((sub: Licao["subLicoes"][number]) => `${sub.disciplina} (${sub.material})`).join(", ")}
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

      {/* Paginação */}
      <div className="flex justify-center gap-2 mt-4">
        <Button
          disabled={page <= 1}
          onClick={() => setPage((p: number) => p - 1)}
        >
          Anterior
        </Button>
        <span className="px-2 py-1">{page} / {totalPages}</span>
        <Button
          disabled={page >= totalPages}
          onClick={() => setPage((p: number) => p + 1)}
        >
          Próxima
        </Button>
      </div>
    </div>
  );
}
