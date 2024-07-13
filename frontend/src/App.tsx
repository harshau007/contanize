import React, { useState, useEffect, useRef } from "react";
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

  const isInitialMount = useRef(true);

  const handleContainer = async () => {
    const containerData = await ListAllContainersJSON();
    setContainers(containerData || []);
  };

  const handleImages = async () => {
    const imageData = await ListImages();
    setImages(imageData || []);
  };

  useEffect(() => {
    const fetchData = async () => {
      await handleContainer();
      await handleImages();

      if (isInitialMount.current) {
        if (containers.length > 0 && !selectedCont) {
          setSelectedCont(containers[0]);
        }
        if (images.length > 0 && !selectedImage) {
          setSelectedImage(images[0]);
        }
        isInitialMount.current = false;
      }
    };

    fetchData();

    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, [isDarkMode]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDarkMode);
    localStorage.setItem("theme", isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

  const handleCreateClick = () => setIsFormVisible(true);
  const handleThemeToggle = () => setIsDarkMode((prev) => !prev);

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
