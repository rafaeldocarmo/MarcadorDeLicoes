"use client"

import { useEffect, useState } from "react"
import Dashboard from "@/components/Dashboard"

type AlunoResumo = {
  nome: string
  fez: number
  naoFez: number
}

export default function DashboardClient() {
  const [data, setData] = useState<AlunoResumo[]>([])

  useEffect(() => {
    fetch("/api/dashboard")
      .then(res => res.json())
      .then((res: AlunoResumo[]) => setData(res))
  }, [])

  if (!data.length) return <p>Carregando...</p>

  return <Dashboard initialData={data} />
}
