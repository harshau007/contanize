import { Box, Image as ImageIcon, Moon, Plus, Sun } from "lucide-react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ListAllContainersJSON, ListImages } from "../wailsjs/go/main/App";
import { main } from "../wailsjs/go/models";
import ContainerDetails from "./components/ContainerDetails";
import CreateForm from "./components/CreateForm";
import ImageDetails from "./components/ImageDetails";
import Loading from "./components/Loading";
import Placeholder from "./components/Placeholder";
import { Button } from "./components/ui/button";
import { ScrollArea } from "./components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "./components/ui/tabs";
import "./globals.css";
import { ThemeProvider, useTheme } from "./lib/theme-provider";

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"containers" | "images">(
    () =>
      (localStorage.getItem("activeTab") as "containers" | "images") ||
      "containers"
  );
  const [selectedImageId, setSelectedImageId] = useState<string | null>(
    () => localStorage.getItem("selectedImageId") || null
  );
  const [selectedContId, setSelectedContId] = useState<string | null>(
    () => localStorage.getItem("selectedContId") || null
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
    localStorage.setItem("activeTab", activeTab);
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === "containers" && containers.length > 0) {
      if (!selectedContId || !containers.some((c) => c.id === selectedContId)) {
        const newSelectedId = containers[0].id;
        setSelectedContId(newSelectedId);
        localStorage.setItem("selectedContId", newSelectedId);
      }
    } else if (activeTab === "images" && images.length > 0) {
      if (
        !selectedImageId ||
        !images.some((i) => i.image_id === selectedImageId)
      ) {
        const newSelectedId = images[0].image_id;
        setSelectedImageId(newSelectedId);
        localStorage.setItem("selectedImageId", newSelectedId);
      }
    }
  }, [activeTab, containers, images, selectedContId, selectedImageId]);

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

  const handleItemClick = useCallback(
    (id: string) => {
      if (activeTab === "containers") {
        setSelectedContId(id);
        localStorage.setItem("selectedContId", id);
      } else {
        setSelectedImageId(id);
        localStorage.setItem("selectedImageId", id);
      }
    },
    [activeTab]
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
                isSelected
                  ? "bg-accent text-accent-foreground"
                  : "hover:bg-accent/50"
              }`}
              onClick={() => handleItemClick(id)}
            >
              {activeTab === "containers" ? (
                <Box className="inline-block mr-2 h-4 w-4" />
              ) : (
                <ImageIcon className="inline-block mr-2 h-4 w-4" />
              )}
              {name}
            </li>
          );
        })}
      </ul>
    );
  }, [
    activeTab,
    containers,
    images,
    selectedContId,
    selectedImageId,
    handleItemClick,
    isCreating,
  ]);

  return (
    <ThemeProvider>
      <AppContent
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedContainer={selectedContainer}
        selectedImage={selectedImage}
        containers={containers}
        images={images}
        isFormOpen={isFormOpen}
        isCreating={isCreating}
        setIsCreating={setIsCreating}
        handleCreateClick={handleCreateClick}
        handleCloseForm={handleCloseForm}
        renderList={renderList}
      />
    </ThemeProvider>
  );
};

interface AppContentProps {
  activeTab: "containers" | "images";
  setActiveTab: React.Dispatch<React.SetStateAction<"containers" | "images">>;
  selectedContainer: main.containerDetail | null;
  selectedImage: main.imageDetail | null;
  containers: main.containerDetail[];
  images: main.imageDetail[];
  isFormOpen: boolean;
  isCreating: boolean;
  setIsCreating: React.Dispatch<React.SetStateAction<boolean>>;
  handleCreateClick: () => void;
  handleCloseForm: () => void;
  renderList: () => JSX.Element;
}

const AppContent: React.FC<AppContentProps> = ({
  activeTab,
  setActiveTab,
  selectedContainer,
  selectedImage,
  containers,
  images,
  isFormOpen,
  isCreating,
  setIsCreating,
  handleCreateClick,
  handleCloseForm,
  renderList,
}) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="flex h-screen select-none bg-background text-foreground">
      <aside className="w-64 border-r border-border p-4 flex flex-col">
        <Button onClick={handleCreateClick} className="mb-4 w-full">
          <Plus className="mr-2 h-4 w-4" />
          Create
        </Button>
        <Tabs
          value={activeTab}
          onValueChange={(value: string) =>
            setActiveTab(value as "containers" | "images")
          }
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="containers">Containers</TabsTrigger>
            <TabsTrigger value="images">Images</TabsTrigger>
          </TabsList>
        </Tabs>
        <ScrollArea className="flex-grow">{renderList()}</ScrollArea>
        <div className="mt-auto pt-4 flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            {theme === "light" ? (
              <Moon className="h-[1.2rem] w-[1.2rem]" />
            ) : (
              <Sun className="h-[1.2rem] w-[1.2rem]" />
            )}
          </Button>
        </div>
      </aside>
      <main className="flex-1 p-4 overflow-auto">
        {activeTab === "containers" && selectedContainer && (
          <ContainerDetails container={selectedContainer} />
        )}
        {activeTab === "images" && selectedImage && (
          <ImageDetails image={selectedImage} />
        )}
        {activeTab === "containers" && containers.length === 0 && (
          <Placeholder text="No containers available" />
        )}
        {activeTab === "images" && images.length === 0 && (
          <Placeholder text="No images available" />
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
