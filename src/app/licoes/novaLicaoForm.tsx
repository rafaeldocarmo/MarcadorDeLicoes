"use client";

import { useState, useTransition } from "react";
import { criarLicao } from "./actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { redirect } from "next/navigation";
import Link from "next/link";

// Shadcn UI components
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";

export default function NovaLicaoForm() {
  const [subLicoes, setSubLicoes] = useState([{ disciplina: "", material: "", descricao: "" }]);
  const [isPending, startTransition] = useTransition();

  const [dataEnvio, setDataEnvio] = useState(new Date());
  // eslint-disable-next-line react-hooks/purity
  const [dataEntrega, setDataEntrega] = useState(new Date(Date.now() + 24 * 60 * 60 * 1000));

  // Exemplo de opções fixas (pode vir da API)
  const disciplinas = ["Matemática", "Português", "Ciências", "História", "Geografia"];
  const materiais = ["Livro", "Caderno", "Exercícios", "Vídeo", "Slides"];

  function adicionarSubLicao() {
    setSubLicoes((prev) => [...prev, { disciplina: "", material: "", descricao: "" }]);
  }

  function removerSubLicao(index: number) {
    setSubLicoes((prev) => prev.filter((_, i) => i !== index));
  }

  function atualizarSubLicao(index: number, field: string, value: string) {
    setSubLicoes((prev) => prev.map((sub, i) => (i === index ? { ...sub, [field]: value } : sub)));
  }

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const licao = await criarLicao({
        titulo: formData.get("titulo") as string,
        dataEnvio: dataEnvio.toISOString(),
        dataEntrega: dataEntrega.toISOString(),
        turmaId: '1',
        subLicoes,
      });
      if (licao.id) redirect(`/licoes/${licao.id}`);
    });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 p-6">
      <Card className="w-full max-w-3xl rounded-2xl shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold">Criar Nova Lição</CardTitle>
        </CardHeader>

        <CardContent>
          <form action={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="titulo">Título</Label>
              <Input type="text" id="titulo" name="titulo" required className="input w-full" />
            </div>

              {/* Data de Envio */}
              <div className="space-y-1">
                <Label>Data de Envio</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full text-left">
                      {format(dataEnvio, "dd/MM/yyyy")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dataEnvio}
                      onSelect={(date) => date && setDataEnvio(date)}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Data de Entrega */}
              <div className="space-y-1">
                <Label>Data de Entrega</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full text-left">
                      {format(dataEntrega, "dd/MM/yyyy")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dataEntrega}
                      onSelect={(date) => date && setDataEntrega(date)}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Sublições */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Sublições</h2>
              {subLicoes.map((sub, index) => (
                <div key={index} className="relative rounded-2xl border bg-background p-6 shadow-sm space-y-4">
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Disciplina</Label>
                      <Select value={sub.disciplina} onValueChange={(v) => atualizarSubLicao(index, "disciplina", v)} required>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecione a disciplina" />
                        </SelectTrigger>
                        <SelectContent>
                          {disciplinas.map((d) => (
                            <SelectItem key={d} value={d}>{d}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Material</Label>
                      <Select value={sub.material} onValueChange={(v) => atualizarSubLicao(index, "material", v)} required>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecione o material" />
                        </SelectTrigger>
                        <SelectContent>
                          {materiais.map((m) => (
                            <SelectItem key={m} value={m}>{m}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                  </div>

                  <div className="space-y-2">
                    <Label>Descrição</Label>
                    <Textarea value={sub.descricao} onChange={(e) => atualizarSubLicao(index, "descricao", e.target.value)} required />
                  </div>
                  {subLicoes.length > 1 && (
                    <div className="flex justify-end">
                      <Button type="button" variant="destructive" size="sm" onClick={() => removerSubLicao(index)}>
                        Remover
                      </Button>
                    </div>
                  )}
                </div>
              ))}
              <Button type="button" variant="outline" onClick={adicionarSubLicao}>
                + Adicionar Sublição
              </Button>
            </div>

            <div className="flex justify-between">
              <Button className="rounded-2xl px-6" variant="destructive"><Link href='/'>Cancelar</Link></Button>
              <Button disabled={isPending} className="rounded-2xl px-6">{isPending ? "Criando..." : "Criar Lição"}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
