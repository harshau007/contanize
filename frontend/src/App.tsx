import React, { useState, useRef, FormEvent, useEffect } from "react";
import { FiPlus, FiExternalLink, FiTrash2, FiPlay } from "react-icons/fi";
import { FaRegStopCircle } from "react-icons/fa";
import {
  SelectFolder,
  ListAllContainersJSON,
  URL,
  CreateCodeInstance,
  RemoveContainer,
  StartContainer,
  StopContainer,
  ListImages,
  RemoveImages,
} from "../wailsjs/go/main/App";
import { main } from "wailsjs/go/models";
import "./globals.css";

const App = () => {
  const [activeTab, setActiveTab] = useState("containers");
  const [sidebarWidth, setSidebarWidth] = useState(25);
  const isDragging = useRef(false);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging.current) {
      const newWidth = (e.clientX / window.innerWidth) * 100;
      if (newWidth > 15 && newWidth < 50) {
        setSidebarWidth(newWidth);
      }
    }
  };

  const handleMouseDown = () => {
    isDragging.current = true;
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleMouseUp = () => {
    isDragging.current = false;
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  };

  const handleCreateClick = () => {
    setIsFormVisible(true);
  };

  const handleSubmit = async (
    e: React.FormEvent,
    containerName: string,
    technology: string,
    folder: string
  ) => {
    e.preventDefault();
    setIsCreating(true);
    setIsFormVisible(false);
    await CreateCodeInstance(containerName, technology, folder);
    setIsCreating(false);
  };

  const handleTabClick = (tab: string) => {
    setActiveTab(tab);
    setIsFormVisible(false); // Close the form when switching tabs
  };

  return (
    <div className="flex h-screen select-none">
      <aside
        className={`relative bg-dark-gray text-white p-2 pt-4 ${
          isCreating ? "pointer-events-none bg-dark-gray opacity-90" : ""
        }`}
        style={{ width: `${sidebarWidth}%` }}
      >
        <div className="flex items-center justify-center mb-4">
          <button
            className="bg-blue-700 py-2 px-4 rounded-full flex items-center hover:bg-blue-600"
            onClick={handleCreateClick}
            disabled={isCreating}
          >
            <FiPlus className="mr-2" />
            Create
          </button>
        </div>
        <nav>
          <ul>
            <li
              className={`p-2 pl-4 mr-2 cursor-pointer font-bold text-lg ${
                activeTab === "containers" ? "bg-gray-700 rounded-lg" : ""
              }`}
              onClick={() => handleTabClick("containers")}
            >
              Containers
            </li>
            <li
              className={`p-2 pl-4 mr-2 cursor-pointer font-bold text-lg ${
                activeTab === "images" ? "bg-gray-700 rounded-lg" : ""
              }`}
              onClick={() => handleTabClick("images")}
            >
              Images
            </li>
          </ul>
        </nav>
        <div
          className={`absolute top-0 right-0 w-[2px] h-full cursor-ew-resize bg-gray-600 ${
            isCreating ? "pointer-events-none" : ""
          }`}
          onMouseDown={handleMouseDown}
        />
      </aside>
      <main className="flex-1 bg-deep-dark text-white p-4 overflow-auto">
        <>
          {activeTab === "containers" && !isFormVisible && (
            <ContainersScreen isCreating={isCreating} />
          )}
          {activeTab === "images" && !isFormVisible && <ImagesScreen />}
          {isFormVisible && (
            <CreateForm
              onSubmit={(e, containerName, technology, folder) =>
                handleSubmit(e, containerName, technology, folder)
              }
            />
          )}
        </>
      </main>
    </div>
  );
};

interface CreateFormProps {
  onSubmit: (
    e: FormEvent,
    containerName: string,
    technology: string,
    folder: string
  ) => void;
}

const CreateForm: React.FC<CreateFormProps> = ({ onSubmit }) => {
  const [containerName, setContainerName] = useState("");
  const [technology, setTechnology] = useState("");
  const [folder, setFolder] = useState("");
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

  const handleFolderSelect = async () => {
    const selectedFolder = await SelectFolder();
    setFolder(selectedFolder);
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(e, containerName, technology, folder);
  };

  return (
    <form
      className="rounded-lg border border-gray-300 text-white shadow-md p-4 space-y-4"
      onSubmit={handleSubmitForm}
    >
      <div>
        <label className="block text-sm font-medium" htmlFor="containerName">
          Container Name
        </label>
        <input
          id="containerName"
          type="text"
          className="mt-1 block w-full p-2 border border-gray-300 rounded text-black"
          value={containerName}
          onChange={(e) => setContainerName(e.target.value)}
          placeholder="Container Name"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium" htmlFor="technology">
          Technology
        </label>
        <select
          id="technology"
          className="mt-1 block w-full p-2 border border-gray-300 rounded text-black"
          value={technology}
          onChange={(e) => setTechnology(e.target.value)}
          required
        >
          <option value="">Select Technology</option>
          {choices.map((choice, index) => (
            <option key={index} value={choice.toLowerCase()}>
              {choice}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium">Select Folder</label>
        <button
          type="button"
          className="mt-1 block w-full p-2 border border-gray-300 rounded hover:bg-dark-gray"
          onClick={handleFolderSelect}
        >
          Select Folder
        </button>
        {folder && <p className="text-gray-500">{folder}</p>}
      </div>
      <button
        type="submit"
        className="block w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
      >
        Create
      </button>
    </form>
  );
};

const ContainersScreen: React.FC<{ isCreating: boolean }> = ({
  isCreating,
}) => {
  const [containers, setContainers] = useState<main.containerDetail[]>([]);

  const handleContainer = async () => {
    const containerData = await ListAllContainersJSON();
    setContainers(containerData);
    // console.log(JSON.stringify(containerData));
  };

  useEffect(() => {
    handleContainer();
    const interval = setInterval(handleContainer, 3000); // Fetch container data every 3 seconds
    return () => clearInterval(interval); // Clear the interval on component unmount
  }, []);

  return (
    <div className="h-full overflow-auto">
      <h2 className="text-2xl font-bold mb-4">Containers</h2>
      <div className="space-y-4">
        {containers.map((container, index) => (
          <ContainerCard key={index} container={container} />
        ))}
        {isCreating ? <PlaceholderCard isCreating={isCreating} /> : null}
      </div>
    </div>
  );
};

const PlaceholderCard: React.FC<{ isCreating: boolean }> = ({ isCreating }) => (
  <div
    className={`bg-gray-800 p-4 rounded-md flex justify-between items-center relative ${
      isCreating ? "filter grayscale" : ""
    }`}
  >
    <div>
      <p className="font-bold text-gray-400">Creating Container...</p>
      <p className="opacity-50 text-gray-400">ID: --</p>
      <p className="opacity-50 text-gray-400">Image: --</p>
      <p className="opacity-50 text-gray-400">Volume: --</p>
      <p className="opacity-50 text-gray-400">Created At: --</p>
      <p className="font-semibold text-gray-400">Status: --</p>
    </div>
    {isCreating && (
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r rounded-md from-white to-transparent pointer-events-none opacity-50 animate-ray" />
    )}
  </div>
);

const ContainerCard: React.FC<{ container: main.containerDetail }> = ({
  container,
}) => {
  const handleDeleteClick = async (id: string, status: string) => {
    if (status !== "Exited") {
      if (
        window.confirm(
          "Are you sure you want to delete this running container?"
        )
      ) {
        await RemoveContainer(id, true);
      }
    } else {
      await RemoveContainer(id, false);
    }
  };
  const handleControlClick = async (name: string, status: string) => {
    if (status !== "Exited") {
      // Stop container
      await StopContainer(name);
    } else {
      // Start container
      await StartContainer(name);
    }
  };

  return (
    <div className="bg-gray-800 p-4 rounded-md flex justify-between items-center relative">
      <div>
        <p className="font-bold">
          {container.name.length > 0 ? container.name : "No Name"}
        </p>
        <p className="opacity-50">ID: {container.id.slice(0, 10)}</p>
        <p className="opacity-50">Image: {container.image}</p>
        <p className="opacity-50">Volume: {container.volume || "N/A"}</p>
        <p className="opacity-50">Created At: {container.created}</p>
        <p
          className={`font-semibold ${
            container.status === "running"
              ? "text-green-500"
              : container.status.slice(0, 6) === "Exited"
              ? "text-red-500"
              : "text-green-500"
          }`}
        >
          Status: {container.status}
        </p>
      </div>
      <div className="flex space-x-4">
        {container.status.slice(0, 6) !== "Exited" ? (
          <FaRegStopCircle
            className="h-6 w-6 text-red-500 cursor-pointer"
            onClick={() =>
              handleControlClick(
                container.id.slice(0, 9),
                container.status.slice(0, 6)
              )
            }
          />
        ) : (
          <FiPlay
            className="h-6 w-6 text-green-500 cursor-pointer"
            onClick={() =>
              handleControlClick(container.name, container.status.slice(0, 6))
            }
          />
        )}
        <FiTrash2
          className="h-6 w-6 text-red-500 cursor-pointer"
          onClick={() =>
            handleDeleteClick(container.name, container.status.slice(0, 6))
          }
        />
        {container.url && container.status.slice(0, 6) !== "Exited" ? (
          <a
            onClick={async () => {
              await URL(container.url);
            }}
            target="_blank"
            rel="noopener noreferrer"
            className="text-white hover:text-blue-500 hover:cursor-pointer"
          >
            <FiExternalLink className="w-6 h-6" />
          </a>
        ) : (
          <FiExternalLink className="text-gray-400 w-6 h-6" />
        )}
      </div>
    </div>
  );
};

const ImagesScreen = () => {
  const [images, setImages] = useState<main.imageDetail[]>([]);
  const [loading, setLoading] = useState(true);

  const handleImages = async () => {
    const imageData = await ListImages();
    setImages(imageData);
    setLoading(false);
    // console.log(JSON.stringify(imageData));
  };

  useEffect(() => {
    handleImages();
  }, []);

  return (
    <div className="h-full overflow-auto">
      <h2 className="text-2xl font-bold mb-4">Images</h2>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="space-y-4">
          <ImageCard images={images} />
        </div>
      )}
    </div>
  );
};

const ImageCard: React.FC<{ images: main.imageDetail[] }> = ({ images }) => {
  const [usedImages, setUsedImages] = useState<string[]>([]);

  useEffect(() => {
    const checkImageUsage = async () => {
      try {
        const containers = await ListAllContainersJSON();
        const usedIds = containers
          .filter((container) => container.status !== "Exited")
          .map((container) =>
            container.image_id.replace("sha256:", "").slice(0, 10)
          );
        setUsedImages(usedIds);
      } catch (error) {
        console.error("Error checking container usage:", error);
      }
    };

    checkImageUsage();
  }, []);

  const isImageUsed = (imageId: string) => usedImages.includes(imageId);

  const handleDeleteClick = async (imageId: string) => {
    if (isImageUsed(imageId)) {
      alert(
        "This image is being used by a running container. Please remove the container first."
      );
      return;
    }

    if (window.confirm("Are you sure you want to delete this image?")) {
      await RemoveImages(imageId, true, true);
    }
  };

  return (
    <>
      {images.map((image) => (
        <div
          key={image.image_id}
          className="bg-gray-800 p-4 rounded-md flex justify-between items-center relative"
        >
          <div>
            <p className="font-bold">{image.repository}</p>
            <p className="opacity-50">Tag: {image.tag}</p>
            <p className="opacity-50">ID: {image.image_id}</p>
            <p className="opacity-50">Size: {image.size}</p>
          </div>
          <div className="flex space-x-4">
            <FiTrash2
              className={`h-6 w-6 text-red-500 cursor-pointer ${
                isImageUsed(image.image_id)
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              }`}
              onClick={() => handleDeleteClick(image.image_id)}
            />
          </div>
        </div>
      ))}
    </>
  );
};

export default App;
