import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { main } from "../../wailsjs/go/models";
import ImageDetails from "./ImageDetails";

interface ImagesTabProps {
  images: main.imageDetail[];
}

const ImagesTab: React.FC<ImagesTabProps> = ({ images }) => {
  const [selectedImage, setSelectedImage] = useState<main.imageDetail | null>(
    null
  );

  return (
    <div className="flex h-full">
      <ScrollArea className="w-1/3 pr-4">
        {images.map((image) => (
          <Card
            key={image.image_id}
            className="mb-4 cursor-pointer hover:bg-accent"
            onClick={() => setSelectedImage(image)}
          >
            <CardHeader>
              <CardTitle>
                {image.repository}:{image.tag}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>ID: {image.image_id.slice(0, 10)}</p>
              <p>Size: {image.size}</p>
            </CardContent>
          </Card>
        ))}
      </ScrollArea>
      <div className="w-2/3 pl-4">
        {selectedImage ? (
          // <ImageDetails image={selectedImage} />
          <></>
        ) : (
          <p className="text-center text-muted-foreground">
            Select an image to view details
          </p>
        )}
      </div>
    </div>
  );
};

export default ImagesTab;
