import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { FiPlay, FiStopCircle, FiTrash2, FiExternalLink } from "react-icons/fi";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { main } from "../../wailsjs/go/models";
import { URL, StartContainer, StopContainer } from "../../wailsjs/go/main/App";
import {
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  Tooltip as ShadTooltip,
} from "./ui/tooltip";

interface ContainerDetailsProps {
  container: main.containerDetail;
}

const ContainerDetails: React.FC<ContainerDetailsProps> = ({ container }) => {
  // Dummy data for the container
  const containerInfo = {
    id: container.id,
    name: "Sample Container",
    image: "nginx:latest",
    status: "Running",
    created: "2023-07-01 10:00:00",
    ports: "80/tcp, 443/tcp",
  };

  // Dummy data for the CPU usage chart
  const cpuData = Array.from({ length: 24 }, (_, i) => ({
    time: `${i}:00`,
    usage: Math.random() * 100,
  }));

  // Dummy data for the memory usage chart
  const memoryData = Array.from({ length: 24 }, (_, i) => ({
    time: `${i}:00`,
    usage: Math.floor(Math.random() * 1024),
  }));

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>{container.name}</span>
            <div>
              <TooltipProvider>
                <ShadTooltip>
                  <TooltipTrigger>
                    <Button variant="outline" size="icon" className="mr-2">
                      {container.status.slice(0, 6) !== "Exited" ? (
                        <FiStopCircle
                          onClick={async () => {
                            await StopContainer(container.id);
                          }}
                        />
                      ) : (
                        <FiPlay />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {container.status.slice(0, 6) !== "Exited" ? (
                      <p>Stop</p>
                    ) : (
                      <p>Run</p>
                    )}
                  </TooltipContent>
                </ShadTooltip>
                <ShadTooltip>
                  <TooltipTrigger>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={async () => {
                        await URL(container.url);
                      }}
                      className="mr-2"
                    >
                      <FiExternalLink />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>URL</p>
                  </TooltipContent>
                </ShadTooltip>
                <ShadTooltip>
                  <TooltipTrigger>
                    <Button variant="outline" size="icon">
                      <FiTrash2 />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Remove</p>
                  </TooltipContent>
                </ShadTooltip>
              </TooltipProvider>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>
            <strong>ID:</strong> {container.id}
          </p>
          <p>
            <strong>Image:</strong> {container.image}
          </p>
          <p>
            <strong>Status:</strong> {container.status}
          </p>
          <p>
            <strong>Created:</strong> {container.created}
          </p>
          <p>
            <strong>Ports:</strong>{" "}
            {container.public_ports ? container.public_ports.join(", ") : ""}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>CPU Usage</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={cpuData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="usage" stroke="#8884d8" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Memory Usage</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={memoryData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="usage" stroke="#82ca9d" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default ContainerDetails;
