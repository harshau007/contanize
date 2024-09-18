import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  Play,
  StopCircle,
  Terminal,
  Trash2,
} from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import {
  GetContainerLogs,
  GetContainerMetrics,
  GetCPUStats,
  GetMemoryStats,
  OpenMongoTerminal,
  OpenPostgresTerminal,
  RemoveContainer,
  StartContainer,
  StopContainer,
  URL,
} from "../../wailsjs/go/main/App";
import { main } from "../../wailsjs/go/models";
import { GenericLineChart } from "./ui/charts/GenericLineChart";
import { RadarChart } from "./ui/charts/RadarChart";
import { ScrollArea, ScrollBar } from "./ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

const MAX_DATA_POINTS = 15;

interface ContainerDetailsProps {
  container: main.containerDetail;
}

export default function ContainerDetails({ container }: ContainerDetailsProps) {
  const [cpuUsage, setCpuUsage] = useState<main.CPUStats[]>([]);
  const [memUsage, setMemUsage] = useState<main.MemoryStats[]>([]);
  const [isPortDialogOpen, setIsPortDialogOpen] = useState(false);
  const [additionalPort, setAdditionalPort] = useState("");
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false);
  const [radarData, setRadarData] = useState<main.ContainerMetrics>();
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);
  const [logs, setLogs] = useState<main.ContainerLog[]>([]);

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

  const handleContainerLog = async () => {
    const contLogs = await GetContainerLogs(container.id);
    setLogs((prevLog) => [...prevLog, ...contLogs].slice(-contLogs.length));
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

  const getConnectionString = useCallback(
    (showPass: boolean = false) => {
      const port =
        container.public_ports && container.public_ports.length > 0
          ? container.public_ports[0]
          : "";
      if (container.db.match("postgres")) {
        return `postgresql://${container.dbuser}:${
          showPass ? container.dbpass : "********"
        }@localhost:${port}/${container.db}`;
      } else if (container.db.match("mongo")) {
        return `mongodb://${container.dbuser}:${
          showPass ? container.dbpass : "********"
        }@localhost:${port}/${container.db}`;
      }
      return "";
    },
    [container]
  );

  const handleShowPassword = () => {
    setShowPassword(true);
    setTimeout(() => setShowPassword(false), 3000);
  };

  const handleCopyConnectionString = () => {
    navigator.clipboard.writeText(getConnectionString(true));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    handleCpuUsage();
    handleMemUsage();
    handleRadarData();
    handleContainerLog();

    const interval = setInterval(() => {
      handleCpuUsage();
      handleMemUsage();
      handleRadarData();
      handleContainerLog();
    }, 5000);

    return () => {
      clearInterval(interval);
    };
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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>{container.name}</span>
            <div className="flex space-x-2">
              {container.isdatabase ? (
                <>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={handleStartContainer}
                        >
                          {container.status.slice(0, 6) !== "Exited" ? (
                            <StopCircle className="h-4 w-4" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          {container.status.slice(0, 6) !== "Exited"
                            ? "Stop"
                            : "Run"}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={async () => {
                            if (container.db.match("postgres")) {
                              await OpenPostgresTerminal(
                                container.name,
                                container.dbuser
                              );
                            }
                            if (container.db.match("mongo")) {
                              await OpenMongoTerminal(
                                container.name,
                                container.dbuser
                              );
                            }
                          }}
                          disabled={container.status.slice(0, 6) === "Exited"}
                        >
                          <Terminal className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Terminal</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </>
              ) : (
                <>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={handleStartContainer}
                        >
                          {container.status.slice(0, 6) !== "Exited" ? (
                            <StopCircle className="h-4 w-4" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          {container.status.slice(0, 6) !== "Exited"
                            ? "Stop"
                            : "Run"}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={async () => {
                            await URL(container.url);
                          }}
                          disabled={
                            !container.url ||
                            container.status.slice(0, 6) === "Exited"
                          }
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>URL</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </>
              )}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={(event) => handleDelete(container.id, event)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Remove</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p>
                <strong>ID:</strong> {container.id}
              </p>
              <p>
                <strong>Image:</strong> {container.image}
              </p>
              <p>
                <strong>Status:</strong> {container.status}
              </p>
            </div>
            <div>
              <p>
                <strong>Created:</strong> {container.created}
              </p>
              <p>
                <strong>Ports:</strong>{" "}
                {container.public_ports
                  ? container.public_ports.join(", ")
                  : "<none>"}
              </p>
            </div>
          </div>
          {container?.isdatabase &&
            container?.status?.slice(0, 6) !== "Exited" && (
              <div className="mt-4">
                <Label className="mb-2">Connection String:</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    type="text"
                    value={getConnectionString(showPassword)}
                    readOnly
                    className="flex-grow"
                  />
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={handleShowPassword}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{showPassword ? "Hide" : "Show"} Password</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={handleCopyConnectionString}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{copied ? "Copied!" : "Copy"}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            )}
        </CardContent>
      </Card>

      <Tabs defaultValue="stats">
        <TabsList>
          <TabsTrigger value="stats">Stats</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
        </TabsList>
        <TabsContent value="stats">
          {container.status.slice(0, 6) !== "Exited" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Container Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <RadarChart
                    data={[
                      {
                        metric: "CPU Usage (%)",
                        value: parseFloat(radarData?.cpuUsage || "0"),
                      },
                      {
                        metric: "Memory (%)",
                        value: parseFloat(radarData?.memoryUsage || "0"),
                      },
                      {
                        metric: "Network In (MB/s)",
                        value: parseFloat(radarData?.networkInput || "0"),
                      },
                      {
                        metric: "Network Out (MB/s)",
                        value: parseFloat(radarData?.networkOutput || "0"),
                      },
                      {
                        metric: "Disk I/O (MB/s)",
                        value: parseFloat(radarData?.diskIO || "0"),
                      },
                      {
                        metric: "Running Processes",
                        value: parseFloat(radarData?.runningProcesses || "0"),
                      },
                    ]}
                    status={container.status.slice(0, 6)}
                  />
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent>
                <div className="flex justify-center items-center h-72 text-gray-500">
                  Inactive Container
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle>Container Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[40rem] w-full whitespace-nowrap rounded-md border p-4">
                {logs.length > 0 ? (
                  <>
                    {" "}
                    {logs.map((log, index) => (
                      <div key={index} className="mb-1 font-mono text-sm">
                        {log.logLine}
                      </div>
                    ))}
                  </>
                ) : (
                  <>
                    <p className="text-center text-gray-500">
                      No logs available
                    </p>
                  </>
                )}
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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
                onChange={(e) => setAdditionalPort(e.target.value)}
                placeholder="e.g., 3000"
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
}
