import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { ScrollArea } from "./ui/scroll-area";
import { main } from "../../wailsjs/go/models";
import ContainerDetails from "./ContainerDetails";

interface ContainersTabProps {
  containers: main.containerDetail[];
}

const ContainersTab: React.FC<ContainersTabProps> = ({ containers }) => {
  const [selectedContainer, setSelectedContainer] =
    useState<main.containerDetail | null>(null);

  return (
    <div className="flex h-full">
      <ScrollArea className="w-1/3 pr-4">
        {containers.map((container) => (
          <Card
            key={container.id}
            className="mb-4 cursor-pointer hover:bg-accent"
            onClick={() => setSelectedContainer(container)}
          >
            <CardHeader>
              <CardTitle>{container.name || "Unnamed Container"}</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Status: {container.status}</p>
              <p>ID: {container.id.slice(0, 10)}</p>
            </CardContent>
          </Card>
        ))}
      </ScrollArea>
      <div className="w-2/3 pl-4">
        {selectedContainer ? (
          // <ContainerDetails container={selectedContainer} />
          <></>
        ) : (
          <p className="text-center text-muted-foreground">
            Select a container to view details
          </p>
        )}
      </div>
    </div>
  );
};

export default ContainersTab;
