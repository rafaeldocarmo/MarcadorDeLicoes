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
    nome: string
    fez: number
    naoFez: number
  }[]
}

const chartConfig = {
  fez: {
    label: "Fez",
    color: "var(--chart-2)",
  },
  naoFez: {
    label: "Não fez",
    color: "var(--chart-5)",
  },
} satisfies ChartConfig

export default function ResumoChart({ data }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Resumo de Entregas</CardTitle>
        <CardDescription>
          Quantidade de atividades feitas por aluno
        </CardDescription>
      </CardHeader>

      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart
            accessibilityLayer
            data={data}
            layout="vertical"
            // margin={{ right: 40 }}
          >
            <CartesianGrid horizontal={false} />

            {/* Escondemos eixo Y porque o nome ficará dentro da barra */}
            <YAxis type="category" dataKey="nome" hide />

            <XAxis type="number" allowDecimals={false} hide />

            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="line" />}
            />

            {/* FEZ */}
            <Bar
              dataKey="fez"
              stackId="a"
              layout="vertical"
              fill="#2cba2ca6"
              radius={[6, 0, 0, 6]}
            >
              {/* Nome do aluno dentro da barra */}
              <LabelList
                dataKey="nome"
                position="insideLeft"
                offset={12}
                className="fill-white font-medium text-xs"
              />

              {/* Valor numérico */}
              <LabelList
                dataKey="fez"
                position="insideRight"
                className="fill-white text-xs"
              />
            </Bar>

            {/* NÃO FEZ */}
            <Bar
              dataKey="naoFez"
              stackId="a"
              layout="vertical"
              fill="#ff3939bd"
              radius={[0, 6, 6, 0]}
            >
              <LabelList
                dataKey="naoFez"
                position="insideRight"
                className="fill-white text-xs"
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
