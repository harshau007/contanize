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

const MAX_DATA_POINTS = 15;

interface ContainerDetailsProps {
  container: main.containerDetail;
}

const ContainerDetails: React.FC<ContainerDetailsProps> = ({ container }) => {
  const [cpuUsage, setCpuUsage] = useState<main.CPUStats[]>([]);
  const [memUsage, setMemUsage] = useState<main.MemoryStats[]>([]);
  const [isPortDialogOpen, setIsPortDialogOpen] = useState(false);
  const [additionalPort, setAdditionalPort] = useState("");

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

  const handleDelete = async (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    await RemoveContainer(id, false);
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

      <GenericLineChart
        data={parsedCpuUsage}
        dataKey="usage"
        title="CPU Usage"
        color="hsl(var(--chart-1))"
        status={container.status.slice(0, 6)}
        yAxisDomain={[0, 100]}
        tooltipFormatter={(value) => `${value.toFixed(2)}%`}
      />

      <div className="w-[100%] h-[75%]">
        <GenericLineChart
          data={parsedMemUsage}
          dataKey="usage"
          title="Memory Usage"
          color="hsl(var(--chart-2))"
          status={container.status.slice(0, 6)}
          tooltipFormatter={(value) => `${value.toFixed(2)} MiB`}
        />
      </div>

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
