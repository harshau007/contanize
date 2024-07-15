import React from "react";
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
  status: string;
  yAxisDomain?: [number, number];
  tooltipFormatter?: (value: number) => string;
}

export function GenericLineChart({
  data,
  dataKey,
  title,
  color,
  status,
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
    <Card className="p-5">
      <CardContent>
        {status === "Exited" ? (
          <div className="flex justify-center items-center h-72 text-gray-500">
            Inactive Container
          </div>
        ) : (
          <ChartContainer config={chartConfig}>
            <ResponsiveContainer width="100%">
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
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
