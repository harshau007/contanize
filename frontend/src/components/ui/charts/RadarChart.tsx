import React from "react";
import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart as RechartsRadarChart,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface RadarChartProps {
  data: {
    metric: string;
    value: number;
  }[];
  status: string;
}

const chartConfig = {
  value: {
    label: "Metric Value",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

export const RadarChart: React.FC<RadarChartProps> = ({ data, status }) => {
  return (
    <Card className="w-full h-full">
      {status === "Exited" ? (
        <CardContent>
          <div className="flex justify-center items-center h-72 text-gray-500">
            Inactive Container
          </div>
        </CardContent>
      ) : (
        <CardContent>
          <CardHeader>
            <CardTitle>Container Metrics</CardTitle>
            <CardDescription>
              Showing current metrics for the container
            </CardDescription>
          </CardHeader>
          <ChartContainer config={chartConfig} className="w-full aspect-square">
            <RechartsRadarChart data={data}>
              <ChartTooltip
                cursor={true}
                content={<ChartTooltipContent indicator="line" />}
              />
              <PolarAngleAxis dataKey="metric" />
              <PolarGrid />
              <Radar
                dataKey="value"
                fill="var(--color-value)"
                fillOpacity={0.6}
                dot={{
                  r: 4,
                  fillOpacity: 1,
                }}
              />
            </RechartsRadarChart>
          </ChartContainer>

          <CardFooter className="flex-col gap-2 text-sm">
            <div className="flex items-center gap-2 font-medium leading-none">
              Real-time container metrics
            </div>
            <div className="flex items-center gap-2 leading-none text-muted-foreground">
              Updated every 5 seconds
            </div>
          </CardFooter>
        </CardContent>
      )}
    </Card>
  );
};
