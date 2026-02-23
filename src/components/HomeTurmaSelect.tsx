"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type TurmaOption = {
  id: string;
  nome: string;
};

type Props = {
  selectedTurmaId: string;
  turmas: TurmaOption[];
};

export default function HomeTurmaSelect({ selectedTurmaId, turmas }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleSelect(turmaId: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("turmaId", turmaId);
    router.push(`/home?${params.toString()}`);
    router.refresh();
  }

  return (
    <div className="w-[260px]">
      <Select value={selectedTurmaId} onValueChange={handleSelect}>
        <SelectTrigger className="border-sky-100 bg-white">
          <SelectValue placeholder="Selecionar turma" />
        </SelectTrigger>
        <SelectContent>
          {turmas.map((turma) => (
            <SelectItem key={turma.id} value={turma.id}>
              {turma.nome}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
