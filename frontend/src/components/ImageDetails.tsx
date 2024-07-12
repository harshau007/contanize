import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { FiTrash2 } from "react-icons/fi";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { main } from "wailsjs/go/models";

interface ImageDetailsProps {
  image: main.imageDetail;
}

const ImageDetails: React.FC<ImageDetailsProps> = ({ image }) => {
  // Dummy data for the image
  const imageInfo = {
    id: image.image_id,
    repository: "nginx",
    tag: "latest",
    created: "2023-06-15 14:30:00",
    size: "142 MB",
    architecture: "amd64",
    os: "linux",
  };

  // Dummy data for the layer sizes chart
  const layerData = [
    { name: "Layer 1", size: 25 },
    { name: "Layer 2", size: 40 },
    { name: "Layer 3", size: 30 },
    { name: "Layer 4", size: 47 },
  ];

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
            <strong>Architecture:</strong> {imageInfo.architecture}
          </p>
          <p>
            <strong>OS:</strong> {imageInfo.os}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Layer Sizes</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={layerData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="size" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default ImageDetails;
