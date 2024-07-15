import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { FiPlay, FiStopCircle, FiTrash2, FiExternalLink } from "react-icons/fi";
import { main } from "../../wailsjs/go/models";
import {
  URL,
  StartContainer,
  StopContainer,
  GetCPUStats,
  GetMemoryStats,
  RemoveContainer,
  GetContainerMetrics,
} from "../../wailsjs/go/main/App";
import {
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  Tooltip as ShadTooltip,
} from "./ui/tooltip";
import { GenericLineChart } from "./ui/charts/GenericLineChart";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { RadarChart } from "./ui/charts/RadarChart";

const MAX_DATA_POINTS = 15;

interface ContainerDetailsProps {
  container: main.containerDetail;
}

const ContainerDetails: React.FC<ContainerDetailsProps> = ({ container }) => {
  const [cpuUsage, setCpuUsage] = useState<main.CPUStats[]>([]);
  const [memUsage, setMemUsage] = useState<main.MemoryStats[]>([]);
  const [isPortDialogOpen, setIsPortDialogOpen] = useState(false);
  const [additionalPort, setAdditionalPort] = useState("");
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false);
  const [radarData, setRadarData] = useState<main.ContainerMetrics | null>(
    null
  );

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

  const handleRadarData = async () => {
    const metrics = await GetContainerMetrics(container.id);
    setRadarData(metrics);
  };

  const handleDelete = async (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (container.status.slice(0, 6) !== "Exited") {
      setIsRemoveDialogOpen(true);
    } else {
      await RemoveContainer(id, false);
    }
  };

  const handleForceRemove = async () => {
    await RemoveContainer(container.id, true);
    setIsRemoveDialogOpen(false);
  };

  const handleStartContainer = async () => {
    if (container.status.slice(0, 6) === "Exited") {
      setIsPortDialogOpen(true);
    } else {
      await StopContainer(container.name);
    }
  };

  const handlePortSubmit = async () => {
    setIsPortDialogOpen(false);
    if (additionalPort) {
      await StartContainer(container.name, additionalPort);
    } else {
      await StartContainer(container.name, "");
    }
    setAdditionalPort("");
  };

  const handlePortChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "" || /^\d+$/.test(value)) {
      setAdditionalPort(value);
    }
  };

  useEffect(() => {
    handleCpuUsage();
    handleMemUsage();
    handleRadarData();

    const interval = setInterval(() => {
      handleCpuUsage();
      handleMemUsage();
      handleRadarData();
    }, 5000);

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
                    <Button
                      variant="outline"
                      size="icon"
                      className="mr-2"
                      onClick={handleStartContainer}
                    >
                      {container.status.slice(0, 6) !== "Exited" ? (
                        <FiStopCircle />
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
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={(event) => {
                        handleDelete(container.id, event);
                      }}
                    >
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>CPU Usage</CardTitle>
            </CardHeader>
            <CardContent>
              <GenericLineChart
                data={parsedCpuUsage}
                dataKey="usage"
                title="CPU Usage"
                color="hsl(var(--chart-1))"
                status={container.status.slice(0, 6)}
                yAxisDomain={[0, 100]}
                tooltipFormatter={(value) => `${value.toFixed(2)}%`}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Memory Usage</CardTitle>
            </CardHeader>
            <CardContent>
              <GenericLineChart
                data={parsedMemUsage}
                dataKey="usage"
                title="Memory Usage"
                color="hsl(var(--chart-2))"
                status={container.status.slice(0, 6)}
                tooltipFormatter={(value) => `${value.toFixed(2)} MiB`}
              />
            </CardContent>
          </Card>
        </div>

        <div className="flex items-center justify-center">
          {radarData && (
            <RadarChart
              data={[
                {
                  metric: "CPU Usage (%)",
                  value: parseFloat(radarData.cpuUsage),
                },
                {
                  metric: "Memory Usage (%)",
                  value: parseFloat(radarData.memoryUsage),
                },
                {
                  metric: "Network In (MB/s)",
                  value: parseFloat(radarData.networkInput),
                },
                {
                  metric: "Network Out (MB/s)",
                  value: parseFloat(radarData.networkOutput),
                },
                {
                  metric: "Disk I/O (MB/s)",
                  value: parseFloat(radarData.diskIO),
                },
                {
                  metric: "Running Processes",
                  value: parseFloat(radarData.runningProcesses),
                },
              ]}
              status={container.status.slice(0, 6)}
            />
          )}
        </div>
      </div>

      <AlertDialog
        open={isRemoveDialogOpen}
        onOpenChange={setIsRemoveDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Container Removal</AlertDialogTitle>
            <AlertDialogDescription>
              This container is currently running. Are you sure you want to
              force remove it? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleForceRemove}>
              Force Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isPortDialogOpen} onOpenChange={setIsPortDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Additional Port</DialogTitle>
            <DialogDescription>
              Enter an additional port number to expose when starting the
              container. Leave blank to use default ports.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="port" className="text-right">
                Port
              </Label>
              <Input
                id="port"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                className="col-span-3"
                value={additionalPort}
                onChange={handlePortChange}
                placeholder="e.g., 8080"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handlePortSubmit}>Start Container</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ContainerDetails;
