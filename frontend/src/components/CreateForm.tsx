import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { CreateCodeInstance } from "../../wailsjs/go/main/App";

interface CreateFormProps {
  onClose: () => void;
}

const CreateForm: React.FC<CreateFormProps> = ({ onClose }) => {
  const [containerName, setContainerName] = useState("");
  const [technology, setTechnology] = useState("");
  const [folder, setFolder] = useState("");
  const [port, setPort] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await CreateCodeInstance(containerName, technology, folder, port, "");
    onClose();
  };

  return (
    <Card className="fixed inset-0 flex items-center justify-center bg-background/80">
      <CardContent className="bg-card p-6 rounded-lg shadow-lg w-96">
        <CardHeader>
          <CardTitle>Create New Container</CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            placeholder="Container Name"
            value={containerName}
            onChange={(e) => setContainerName(e.target.value)}
          />
          <Select value={technology} onValueChange={setTechnology}>
            <SelectTrigger>
              <SelectValue placeholder="Select Technology" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="node">Node.js</SelectItem>
              <SelectItem value="python">Python</SelectItem>
              <SelectItem value="go">Go</SelectItem>
            </SelectContent>
          </Select>
          <Input
            placeholder="Folder Path"
            value={folder}
            onChange={(e) => setFolder(e.target.value)}
          />
          <Input
            placeholder="Port"
            value={port}
            onChange={(e) => setPort(e.target.value)}
          />
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Create</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default CreateForm;
