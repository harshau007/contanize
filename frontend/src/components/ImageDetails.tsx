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
import {
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  Tooltip as ShadTooltip,
} from "./ui/tooltip";
import { main } from "../../wailsjs/go/models";
import {
  GetImageLayerSize,
  ListAllContainersJSON,
  RemoveImages,
} from "../../wailsjs/go/main/App";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";

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
  const [usedImages, setUsedImages] = useState<string[]>([]);
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false);

  const handleImagerLayer = async () => {
    const layerResp = await GetImageLayerSize(image.repository);
    layerResp.forEach((layer, index) => {
      if (layer.id === "<missing>") {
        layer.id = `Layer ${index + 1}`;
      }
    });
    setImageLayerInfo(layerResp);
  };

  const handleDelete = async () => {
    await RemoveImages(image.image_id, true, true);
    setIsRemoveDialogOpen(false);
  };

  const openRemoveDialog = () => {
    setIsRemoveDialogOpen(true);
  };

  useEffect(() => {
    const fetchUsedImage = async () => {
      try {
        const containers = await ListAllContainersJSON();
        const usedIds = containers
          .filter((container) => container.status !== "Exited")
          .map((container) =>
            container.image_id.replace("sha256:", "").slice(0, 10)
          );
        setUsedImages(usedIds);
      } catch (error) {
        console.error("Error fetching image data:", error);
      }
    };
    fetchUsedImage();
    handleImagerLayer();
    const interval = setInterval(() => {
      handleImagerLayer();
    }, 3000);
    return () => clearInterval(interval);
  }, [image]);

  const isImageUsed = (imageId: string) => usedImages.includes(imageId);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>
              {image.repository}:{image.tag}
            </span>
            <TooltipProvider>
              <ShadTooltip>
                <TooltipTrigger>
                  <Button
                    variant="outline"
                    size="icon"
                    className={`${
                      isImageUsed(image.image_id)
                        ? "opacity-50 pointer-events-none"
                        : ""
                    }`}
                    onClick={openRemoveDialog}
                  >
                    <FiTrash2 />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Remove</p>
                </TooltipContent>
              </ShadTooltip>
            </TooltipProvider>
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
        <CardContent className="h-75">
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

      <Dialog open={isRemoveDialogOpen} onOpenChange={setIsRemoveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Image Removal</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove this image? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsRemoveDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ImageDetails;
