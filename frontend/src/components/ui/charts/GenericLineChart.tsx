import {
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "../card";
import { ChartConfig, ChartContainer, ChartTooltipContent } from "../chart";

interface GenericLineChartProps {
  data: any[];
  dataKey: string;
  title: string;
  color: string;
  yAxisDomain?: [number, number];
  tooltipFormatter?: (value: number) => string;
}

export function GenericLineChart({
  data,
  dataKey,
  title,
  color,
  yAxisDomain,
  tooltipFormatter = (value) => `${value}`,
}: GenericLineChartProps) {
  const chartConfig = {
    [dataKey]: {
      label: dataKey,
      color: color,
    },
  } satisfies ChartConfig;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <ResponsiveContainer width="100%" height="300px">
            <LineChart
              data={data}
              margin={{
                top: 5,
                right: 10,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="time"
                tickMargin={8}
                tickFormatter={(value) => value.slice(11, 19)}
              />
              <YAxis domain={yAxisDomain} />
              <Tooltip
                formatter={tooltipFormatter}
                content={<ChartTooltipContent hideLabel />}
              />
              <Line
                type="monotone"
                dataKey={dataKey}
                stroke={color}
                strokeWidth={2}
                dot={true}
                activeDot
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
