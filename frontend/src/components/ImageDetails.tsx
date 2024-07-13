import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { FiTrash2 } from "react-icons/fi";
import { Bar, BarChart, CartesianGrid, LabelList, XAxis } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { main } from "../../wailsjs/go/models";
import { GetImageLayerSize } from "../../wailsjs/go/main/App";

interface ImageDetailsProps {
  image: main.imageDetail;
}

const chartConfig = {
  desktop: {
    label: "Size",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

const ImageDetails: React.FC<ImageDetailsProps> = ({ image }) => {
  const [imageLayerInfo, setImageLayerInfo] = useState<main.LayerInfo[]>();

  const handleImagerLayer = async () => {
    const layerResp = await GetImageLayerSize(image.repository);
    layerResp.forEach((layer, index) => {
      if (layer.id === "<missing>") {
        layer.id = `Layer ${index + 1}`;
      }
    });
    setImageLayerInfo(layerResp);
  };

  useEffect(() => {
    handleImagerLayer();
    const interval = setInterval(() => {
      handleImagerLayer();
    }, 3000);
    return () => clearInterval(interval);
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>
              {image.repository}:{image.tag}
            </span>
            <Button variant="outline" size="icon">
              <FiTrash2 />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>
            <strong>ID:</strong> {image.image_id}
          </p>
          <p>
            <strong>Created:</strong> {image.created}
          </p>
          <p>
            <strong>Size:</strong> {image.size}
          </p>
          <p>
            <strong>Architecture:</strong> {image.arch}
          </p>
          <p>
            <strong>OS:</strong> {image.os}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Layer Sizes</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig}>
            <BarChart
              accessibilityLayer
              data={imageLayerInfo}
              margin={{
                top: 20,
              }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="id"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel />}
                formatter={(value) => `Size: ${value} MiB`}
              />
              <Bar dataKey="size" fill="var(--color-desktop)" radius={8}>
                <LabelList
                  position="top"
                  offset={12}
                  className="fill-foreground"
                  fontSize={12}
                />
              </Bar>
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default ImageDetails;
