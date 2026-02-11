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
  }[]
}

const chartConfig = {
  fez: { label: "Fez", color: "var(--chart-2)" },
  naoFez: { label: "Não fez", color: "var(--chart-5)" },
} satisfies ChartConfig

export default function TimelineChart({ data }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Atividades por Dia</CardTitle>
        <CardDescription>Performance diária</CardDescription>
      </CardHeader>

      <CardContent>
        <ChartContainer config={chartConfig}  className="max-h-[200px] w-full">
          <BarChart data={data}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="data" />
            <YAxis allowDecimals={false} />
            <ChartTooltip content={<CustomTooltip />} />


            <Bar
              dataKey="fez"
              stackId="a"
              fill="#2cba2ca6"
              radius={[ 0, 0, 4, 4]}
            />
            <Bar
              dataKey="naoFez"
              stackId="a"
              fill="#ff3939bd"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
