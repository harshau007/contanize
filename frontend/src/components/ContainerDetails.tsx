import React, { useEffect, useState } from "react";
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
import {
  URL,
  StartContainer,
  StopContainer,
  GetCPUStats,
  GetMemoryStats,
} from "../../wailsjs/go/main/App";
import {
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  Tooltip as ShadTooltip,
} from "./ui/tooltip";
import { GenericLineChart } from "./ui/charts/GenericLineChart";
const MAX_DATA_POINTS = 15;
interface ContainerDetailsProps {
  container: main.containerDetail;
}

const ContainerDetails: React.FC<ContainerDetailsProps> = ({ container }) => {
  const [cpuUsage, setCpuUsage] = useState<main.CPUStats[]>([]);
  const [memUsage, setMemUsage] = useState<main.MemoryStats[]>([]);

  const handleCpuUsage = async () => {
    const cpuStats = await GetCPUStats(container.id);
    setCpuUsage((prevStats) =>
      [...prevStats, ...cpuStats].slice(-MAX_DATA_POINTS)
    );
  };

  const handleMemUsage = async () => {
    const memStats = await GetMemoryStats(container.id);
    setMemUsage((prevStats) =>
      [...prevStats, ...memStats].slice(-MAX_DATA_POINTS)
    );
  };

  useEffect(() => {
    handleCpuUsage();
    handleMemUsage();

    const interval = setInterval(() => {
      handleCpuUsage();
      handleMemUsage();
    }, 3000);

    return () => clearInterval(interval);
  }, [container.id]);

  const parsedCpuUsage = cpuUsage.map((stat) => ({
    ...stat,
    usage: parseFloat(stat.usage),
  }));

  const parsedMemUsage = memUsage.map((stat) => ({
    ...stat,
    usage: parseFloat(stat.usage),
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
                    <Button variant="outline" size="icon" className="mr-2 ">
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
                      className={`mr-2 ${
                        container.url &&
                        container.status.slice(0, 6) !== "Exited"
                          ? ""
                          : "disabled:opacity-50 disabled:pointer-events-none"
                      }`}
                      disabled={container.status.slice(0, 6) === "Exited"}
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
            {container.public_ports
              ? container.public_ports.join(", ")
              : "<none>"}
          </p>
        </CardContent>
      </Card>
      <GenericLineChart
        data={parsedCpuUsage}
        dataKey="usage"
        title="CPU Usage"
        color="hsl(var(--chart-1))"
        yAxisDomain={[0, 100]}
        tooltipFormatter={(value) => `${value.toFixed(2)}%`}
      />

      <GenericLineChart
        data={parsedMemUsage}
        dataKey="usage"
        title="Memory Usage"
        color="hsl(var(--chart-2))"
        tooltipFormatter={(value) => `${value.toFixed(2)} MB`}
      />
    </div>
  );
};

export default ContainerDetails;
