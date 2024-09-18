import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip as ShadTooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  GetImageLayerSize,
  ListAllContainersJSON,
  RemoveImages,
} from "../../wailsjs/go/main/App";
import { main } from "../../wailsjs/go/models";
import { ChartConfig, ChartContainer } from "./ui/chart";

interface ImageDetailsProps {
  image: main.imageDetail;
}

const chartConfig = {
  desktop: {
    label: "Size",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

export default function ImageDetails({ image }: ImageDetailsProps) {
  const [imageLayerInfo, setImageLayerInfo] = useState<main.LayerInfo[]>([]);
  const [usedImages, setUsedImages] = useState<string[]>([]);
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false);

  const handleImagerLayer = async () => {
    const layerResp = await GetImageLayerSize(image.repository);
    layerResp.forEach((layer, index) => {
      layer.id = `Layer ${index + 1}`;
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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>
              {image.repository}:{image.tag}
            </span>
            <TooltipProvider>
              <ShadTooltip>
                <TooltipTrigger asChild>
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
                    <Trash2 className="h-4 w-4" />
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p>
                <strong>ID:</strong> {image.image_id}
              </p>
              <p>
                <strong>Created:</strong> {image.created}
              </p>
              <p>
                <strong>Size:</strong> {image.size}
              </p>
            </div>
            <div>
              <p>
                <strong>Architecture:</strong> {image.arch}
              </p>
              <p>
                <strong>OS:</strong> {image.os}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Layer Sizes</CardTitle>
        </CardHeader>
        <CardContent className="h-75">
          <ChartContainer config={chartConfig}>
            <BarChart
              data={imageLayerInfo}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="id" />
              <YAxis />
              <Tooltip />
              <Bar
                dataKey="size"
                fill="hsl(var(--chart-1))"
                radius={[4, 4, 0, 0]}
              >
                <LabelList dataKey="size" position="top" />
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
}
