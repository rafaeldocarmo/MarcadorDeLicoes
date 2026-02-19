"use client"

import { Pie, PieChart, Label } from "recharts"

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
    fez: number
    naoFez: number
    falta: number
  }
}

export default function GeralAlunoChart({ data }: Props) {
  const chartData: Array<{ status: string; label: string; value: number; fill: string }> = [
    {
      status: "fez",
      label: "Fez",
      value: data.fez,
      fill: "#2cba2ca6",
    },
    {
      status: "naoFez",
      label: "Não fez",
      value: data.naoFez,
      fill: "#ff3939bd",
    },
    {
      status: "falta",
      label: "FA",
      value: data.falta,
      fill: "#facc15",
    },
  ]

  const total = chartData.reduce((acc: number, curr: { value: number }) => acc + curr.value, 0)

  const chartConfig = {
    value: {
      label: "Total",
    },
    fez: {
      label: "Fez",
      color: "#2cba2ca6",
    },
    naoFez: {
      label: "Não fez",
      color: "#ff3939bd",
    },
    falta: {
      label: "FA",
      color: "#facc15",
    },
  } satisfies ChartConfig

  return (
    <Card className="flex flex-col border-sky-100 bg-white/95 shadow-sm">
      <CardHeader className="items-center pb-0">
        <CardTitle>Resumo do Aluno</CardTitle>
        <CardDescription>Distribuição total</CardDescription>
      </CardHeader>

      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />

            <Pie
              data={chartData}
              dataKey="value"
              nameKey="label"
              innerRadius={60}
              strokeWidth={5}
            >
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-3xl font-bold"
                        >
                          {total}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-muted-foreground"
                        >
                          Total
                        </tspan>
                      </text>
                    )
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

