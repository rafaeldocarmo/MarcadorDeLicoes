"use client"

import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"

import {
  ChartContainer,
  ChartTooltip,
  type ChartConfig,
} from "@/components/ui/chart"

import { CustomTooltip } from "./CustomTooltip"

type Props = {
  data: {
    data: string
    fez: number
    naoFez: number
    falta: number
  }[]
}

const chartConfig = {
  fez: { label: "Fez", color: "var(--chart-2)" },
  naoFez: { label: "Não fez", color: "var(--chart-5)" },
  falta: { label: "FA", color: "#facc15" },
} satisfies ChartConfig

export default function TimelineChart({ data }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Atividades por Dia</CardTitle>
        <CardDescription>Performance diária</CardDescription>
      </CardHeader>

      <CardContent>
        <div className="w-full overflow-x-auto">
          <ChartContainer config={chartConfig} className="aspect-auto h-[220px] min-w-[560px] w-full">
            <BarChart data={data}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="data" />
              <YAxis allowDecimals={false} />
              <ChartTooltip content={<CustomTooltip />} />

              <Bar
                dataKey="fez"
                stackId="a"
                fill="#2cba2ca6"
                radius={[0, 0, 4, 4]}
              />
              <Bar
                dataKey="falta"
                stackId="a"
                fill="#facc15"
              />
              <Bar
                dataKey="naoFez"
                stackId="a"
                fill="#ff3939bd"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  )
}

