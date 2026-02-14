"use client"

import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  LabelList,
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
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

type Props = {
  data: {
    disciplina: string
    fez: number
    naoFez: number
  }[]
}

const chartConfig = {
  fez: { label: "Fez", color: "var(--chart-2)" },
  naoFez: { label: "Não fez", color: "var(--chart-5)" },
} satisfies ChartConfig

export default function DisciplinaChart({ data }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Lições por Disciplina</CardTitle>
        <CardDescription>Fez vs Não fez</CardDescription>
      </CardHeader>

      <CardContent>
        <div className="w-full overflow-x-auto">
          <ChartContainer config={chartConfig} className="aspect-auto h-[220px] min-w-[560px] w-full">
            <BarChart data={data}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="disciplina" />
              <YAxis allowDecimals={false} />
              <ChartTooltip content={<ChartTooltipContent />} />

              <Bar
                dataKey="fez"
                fill="#2cba2ca6"
                radius={[6, 6, 0, 0]}
              >
                <LabelList
                  dataKey="fez"
                  position="top"
                  className="fill-foreground text-xs"
                />
              </Bar>

              <Bar
                dataKey="naoFez"
                fill="#ff3939bd"
                radius={[6, 6, 0, 0]}
              >
                <LabelList
                  dataKey="naoFez"
                  position="top"
                  className="fill-foreground text-xs"
                />
              </Bar>
            </BarChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  )
}

