import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { Button } from "./components/ui/button";
import { Switch } from "./components/ui/switch";
import { ScrollArea } from "./components/ui/scroll-area";
import { FiPlus } from "react-icons/fi";
import { ListAllContainersJSON, ListImages } from "../wailsjs/go/main/App";
import { main } from "../wailsjs/go/models";
import ContainerDetails from "./components/ContainerDetails";
import ImageDetails from "./components/ImageDetails";
import CreateForm from "./components/CreateForm";
import "./globals.css";

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState("containers");
  const [selectedImage, setSelectedImage] = useState<main.imageDetail | null>(
    null
  );
  const [selectedCont, setSelectedCont] = useState<main.containerDetail | null>(
    null
  );
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(
    () => localStorage.getItem("theme") === "dark"
  );
  const [containers, setContainers] = useState<main.containerDetail[]>([]);
  const [images, setImages] = useState<main.imageDetail[]>([]);

  const handleContainer = async () => {
    const containerData = await ListAllContainersJSON();
    setContainers(containerData || []);
    if (containerData.length > 0 && !selectedCont) {
      setSelectedCont(containerData[0]);
    }
  };

  const handleImages = async () => {
    const imageData = await ListImages();
    setImages(imageData || []);
    if (imageData && imageData.length > 0 && !selectedImage) {
      setSelectedImage(imageData[0]);
    }
  };

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDarkMode);
    localStorage.setItem("theme", isDarkMode ? "dark" : "light");
    handleContainer();
    handleImages();
    const interval = setInterval(() => {
      handleContainer();
      handleImages();
    }, 3000);
    return () => clearInterval(interval);
  }, [isDarkMode]);

  useEffect(() => {}, [activeTab]);

  const handleCreateClick = () => setIsFormVisible(true);
  const handleThemeToggle = () => setIsDarkMode((prev) => !prev);

  return (
    <div
      className={`flex h-screen select-none ${
        isDarkMode ? "dark" : ""
      } bg-background text-foreground`}
    >
      <aside className="w-64 border-r border-border p-4 flex flex-col">
        <Button onClick={handleCreateClick} className="mb-4">
          <FiPlus className="mr-2" />
          Create
        </Button>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="containers">Containers</TabsTrigger>
            <TabsTrigger value="images">Images</TabsTrigger>
          </TabsList>
        </Tabs>
        <ScrollArea className="flex-grow">
          {activeTab === "containers" ? (
            <ul className="space-y-2">
              {containers.map((container) => (
                <li
                  key={container.id}
                  className={`cursor-pointer p-2 pl-5 rounded-lg ${
                    selectedCont?.id === container.id
                      ? "bg-accent"
                      : "hover:bg-accent/50"
                  }`}
                  onClick={() => setSelectedCont(container)}
                >
                  {container.name || container.id.slice(0, 12)}
                </li>
              ))}
            </ul>
          ) : (
            <ul className="space-y-2">
              {images.map((image) => (
                <li
                  key={image.image_id}
                  className={`cursor-pointer p-2 pl-5 rounded-lg ${
                    selectedImage?.image_id === image.image_id
                      ? "bg-accent"
                      : "hover:bg-accent/50"
                  }`}
                  onClick={() => setSelectedImage(image)}
                >
                  {image.repository || image.image_id.slice(0, 12)}
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>
        <div className="mt-auto pt-4 flex items-center justify-between">
          <span>Dark Mode</span>
          <Switch checked={isDarkMode} onCheckedChange={handleThemeToggle} />
        </div>
      </aside>
      <main className="flex-1 p-4 overflow-auto">
        {activeTab === "containers" && selectedCont && (
          <ContainerDetails container={selectedCont} />
        )}
        {activeTab === "images" && selectedImage && (
          <ImageDetails image={selectedImage} />
        )}
      </main>
      {isFormVisible && <CreateForm onClose={() => setIsFormVisible(false)} />}
    </div>
  );
};

export default App;
