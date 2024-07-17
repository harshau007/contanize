import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  CreateCodeInstance,
  CreateDB,
  SelectFolder,
} from "../../wailsjs/go/main/App";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import { IoFolderOpenOutline } from "react-icons/io5";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { AiFillEye, AiFillEyeInvisible } from "react-icons/ai";

interface CreateFormProps {
  open: boolean;
  onClose: () => void;
  isCreating: boolean;
  setIsCreating: (isCreating: boolean) => void;
}

const CreateForm: React.FC<CreateFormProps> = ({
  open,
  onClose,
  isCreating,
  setIsCreating,
}) => {
  const [activeTab, setActiveTab] = useState("package");
  const [containerName, setContainerName] = useState("");
  const [technology, setTechnology] = useState("");
  const [template, setTemplate] = useState("");
  const [database, setDatabase] = useState("");
  const [folder, setFolder] = useState("");
  const [port, setPort] = useState("");
  const [dbname, setDbName] = useState("");
  const [dbpass, setDbPass] = useState("");
  const [dbuser, setDbUser] = useState("");
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  const choices = [
    "NodeLTS",
    "Node18",
    "Node20",
    "Python",
    "Rust",
    "Go",
    "Java8",
    "Java11",
    "Java17",
    "Java20",
    "Java21",
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    onClose();
    setIsCreating(true);
    if (activeTab === "package") {
      await CreateCodeInstance(containerName, technology, folder, port, "");
    } else if (activeTab === "template") {
      await CreateCodeInstance(containerName, "none", folder, port, template);
    } else {
      // dbtype, username, password, dbname, contname
      const id = await CreateDB(
        database,
        dbuser,
        dbpass,
        dbname,
        containerName
      );
      console.log(id);
    }
    setIsCreating(false);
  };

  const handleSelectFolder = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    try {
      const selectedFolderPath = await SelectFolder();
      setFolder(selectedFolderPath);
    } catch (error) {
      console.error("Error selecting folder:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Container</DialogTitle>
        </DialogHeader>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="package">Package</TabsTrigger>
            <TabsTrigger value="template">Template</TabsTrigger>
            <TabsTrigger value="database">Database</TabsTrigger>
          </TabsList>
          <TabsContent value="package">
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
                  {choices.map((choice, index) => (
                    <SelectItem value={choice.toLowerCase()} key={index}>
                      {choice}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="relative">
                <Input placeholder="Folder Path" value={folder} readOnly />
                <Button
                  className="absolute right-0 top-0 h-full"
                  onClick={handleSelectFolder}
                >
                  <IoFolderOpenOutline className="h-5 w-5" />
                </Button>
              </div>
              <Input
                placeholder="Port"
                value={port}
                onChange={(e) => setPort(e.target.value)}
              />
            </form>
          </TabsContent>
          <TabsContent value="template">
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                placeholder="Container Name"
                value={containerName}
                onChange={(e) => setContainerName(e.target.value)}
              />
              <Select value={template} onValueChange={setTemplate}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Template" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Node</SelectLabel>
                    <SelectItem value="next-js">Next-js</SelectItem>
                    <SelectItem value="next-ts">Next-ts</SelectItem>
                    <SelectItem value="nest">Nest</SelectItem>
                  </SelectGroup>
                  <SelectGroup>
                    <SelectLabel>Go</SelectLabel>
                    <SelectItem value="goftt">
                      Go + Fiber + Templ + Tailwind
                    </SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
              <div className="relative">
                <Input placeholder="Folder Path" value={folder} readOnly />
                <Button
                  className="absolute right-0 top-0 h-full"
                  onClick={handleSelectFolder}
                >
                  <IoFolderOpenOutline className="h-5 w-5" />
                </Button>
              </div>
              <Input
                placeholder="Port"
                value={port}
                onChange={(e) => setPort(e.target.value)}
              />
            </form>
          </TabsContent>
          <TabsContent value="database">
            <form onSubmit={handleSubmit} className="space-y-4">
              <Select value={database} onValueChange={setDatabase} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select Database" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>SQL</SelectLabel>
                    <SelectItem value="postgres">PostgreSQL</SelectItem>
                  </SelectGroup>
                  <SelectGroup>
                    <SelectLabel>NoSQL</SelectLabel>
                    <SelectItem value="mongo" disabled>
                      MongoDB
                    </SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
              <Input
                placeholder="Container Name"
                value={containerName}
                onChange={(e) => setContainerName(e.target.value)}
              />
              <Input
                placeholder="Database Name"
                value={dbname}
                onChange={(e) => setDbName(e.target.value)}
              />
              <Input
                placeholder="Database Username"
                value={dbuser}
                onChange={(e) => setDbUser(e.target.value)}
              />
              <div className="relative">
                <Input
                  placeholder="Database Password"
                  value={dbpass}
                  onChange={(e) => setDbPass(e.target.value)}
                  type={showPassword ? "text" : "password"}
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-gray-800 focus:outline-none"
                >
                  {showPassword ? (
                    <AiFillEyeInvisible size={24} />
                  ) : (
                    <AiFillEye size={24} />
                  )}
                </button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateForm;
