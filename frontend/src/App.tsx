import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Tabs, TabsList, TabsTrigger } from "./components/ui/tabs";
import { Button } from "./components/ui/button";
import { ScrollArea } from "./components/ui/scroll-area";
import { FiPlus } from "react-icons/fi";
import { IoSunny, IoMoon } from "react-icons/io5";
import { ListAllContainersJSON, ListImages } from "../wailsjs/go/main/App";
import { main } from "../wailsjs/go/models";
import ContainerDetails from "./components/ContainerDetails";
import ImageDetails from "./components/ImageDetails";
import CreateForm from "./components/CreateForm";
import "./globals.css";
import Loading from "./components/Loading";

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState("containers");
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [selectedContId, setSelectedContId] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(
    () => localStorage.getItem("theme") === "dark"
  );
  const [containers, setContainers] = useState<main.containerDetail[]>([]);
  const [images, setImages] = useState<main.imageDetail[]>([]);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      if (activeTab === "containers") {
        const containerData = await ListAllContainersJSON();
        setContainers((prevContainers) => {
          if (
            JSON.stringify(prevContainers) !== JSON.stringify(containerData)
          ) {
            return containerData || [];
          }
          return prevContainers;
        });
      } else {
        const imageData = await ListImages();
        setImages((prevImages) => {
          if (JSON.stringify(prevImages) !== JSON.stringify(imageData)) {
            return imageData || [];
          }
          return prevImages;
        });
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [fetchData]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDarkMode);
    localStorage.setItem("theme", isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

  const handleThemeToggle = () => setIsDarkMode((prev) => !prev);
  const handleCreateClick = () => setIsFormOpen(true);
  const handleCloseForm = () => setIsFormOpen(false);

  const selectedContainer = useMemo(
    () => containers.find((c) => c.id === selectedContId) || null,
    [containers, selectedContId]
  );

  const selectedImage = useMemo(
    () => images.find((i) => i.image_id === selectedImageId) || null,
    [images, selectedImageId]
  );

  const renderList = useCallback(() => {
    const items = activeTab === "containers" ? containers : images;
    return (
      <ul className="space-y-2">
        {isCreating && activeTab === "containers" && (
          <li className="mb-2">
            <Loading isCreating={isCreating} />
          </li>
        )}
        {items.map((item) => {
          const id = "id" in item ? item.id : item.image_id;
          const name =
            "name" in item
              ? item.name || id.slice(0, 12)
              : item.repository || id.slice(0, 12);
          const isSelected =
            id ===
            (activeTab === "containers" ? selectedContId : selectedImageId);
          return (
            <li
              key={id}
              className={`cursor-pointer p-2 pl-5 rounded-lg ${
                isSelected ? "bg-accent" : "hover:bg-accent/50"
              }`}
              onClick={() =>
                activeTab === "containers"
                  ? setSelectedContId(id)
                  : setSelectedImageId(id)
              }
            >
              {name}
            </li>
          );
        })}
      </ul>
    );
  }, [activeTab, containers, images, selectedContId, selectedImageId]);

  return (
    <div
      className={`flex h-screen select-none ${
        isDarkMode ? "bg-deep-dark" : ""
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
        <ScrollArea className="flex-grow">{renderList()}</ScrollArea>
        <div className="mt-auto pt-4 flex items-center justify-between">
          <button
            className={`absolute bottom-4 left-4 p-2 ${
              isDarkMode ? "bg-deep-dark" : "bg-light-white"
            } rounded-full focus:outline-none`}
            onClick={handleThemeToggle}
          >
            {isDarkMode ? (
              <IoSunny className="text-yellow-500" />
            ) : (
              <IoMoon className="text-deep-dark" />
            )}
          </button>
        </div>
      </aside>
      <main className="flex-1 p-4 overflow-auto">
        {activeTab === "containers" && selectedContainer && (
          <ContainerDetails container={selectedContainer} />
        )}
        {activeTab === "images" && selectedImage && (
          <ImageDetails image={selectedImage} />
        )}
      </main>
      {isFormOpen && (
        <CreateForm
          open={isFormOpen}
          onClose={handleCloseForm}
          isCreating={isCreating}
          setIsCreating={setIsCreating}
        />
      )}
    </div>
  );
};

export default App;
