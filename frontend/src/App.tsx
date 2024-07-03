import React, { useState, useRef, useEffect } from "react";
import {
  FiPlus,
  FiExternalLink,
  FiTrash2,
  FiPlay,
  FiChevronDown,
  FiChevronUp,
} from "react-icons/fi";
import { FaRegStopCircle } from "react-icons/fa";
import { IoSunny, IoMoon } from "react-icons/io5";
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
  CheckIfImageHasChildren,
} from "../wailsjs/go/main/App";
import { main } from "wailsjs/go/models";
import "./globals.css";
import "@fontsource/geist-sans";

const App = () => {
  const [activeTab, setActiveTab] = useState("containers");
  const [sidebarWidth, setSidebarWidth] = useState(25);
  const isDragging = useRef(false);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem("theme") === "dark";
  });

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
    folder: string,
    port: string,
    templateType: string
  ) => {
    e.preventDefault();
    setIsCreating(true);
    setIsFormVisible(false);
    setActiveTab("containers");
    await CreateCodeInstance(
      containerName,
      technology,
      folder,
      port,
      templateType
    );
    setIsCreating(false);
  };

  const handleTabClick = (tab: string) => {
    setActiveTab(tab);
    setIsFormVisible(false); // Close the form when switching tabs
  };

  const handleThemeToggle = () => {
    const newTheme = isDarkMode ? "light" : "dark";
    setIsDarkMode(!isDarkMode);
    localStorage.setItem("theme", newTheme);
  };

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDarkMode);
  }, [isDarkMode]);

  return (
    <div className="flex h-screen select-none">
      <aside
        className={`relative ${
          isDarkMode ? "bg-dark-gray" : "bg-light-white"
        } p-2 pt-4 `}
        style={{ width: `${sidebarWidth}%` }}
      >
        <div className="flex items-center justify-center mb-4">
          <button
            className={`${
              isDarkMode ? "bg-blue-700" : "bg-blue-500"
            } py-2 px-4 rounded-full flex items-center hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-blue-700`}
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
                activeTab === "containers"
                  ? `${
                      isDarkMode
                        ? "bg-gray-700 rounded-lg"
                        : "bg-gray-400 rounded-lg"
                    }`
                  : ""
              }`}
              onClick={() => handleTabClick("containers")}
            >
              Containers
            </li>
            <li
              className={`p-2 pl-4 mr-2 cursor-pointer font-bold text-lg ${
                activeTab === "images"
                  ? `${
                      isDarkMode
                        ? "bg-gray-700 rounded-lg"
                        : "bg-gray-400 rounded-lg"
                    }`
                  : ""
              }`}
              onClick={() => handleTabClick("images")}
            >
              Images
            </li>
            {/* <li
              className={`p-2 pl-4 mr-2 cursor-pointer font-bold text-lg ${
                activeTab === "settings" ? "bg-gray-700 rounded-lg" : ""
              }`}
              onClick={() => handleTabClick("settings")}
            >
              Settings
            </li> */}
          </ul>
        </nav>
        <div
          className={`absolute top-0 right-0 w-[1px] h-full cursor-ew-resize ${
            isDarkMode ? "bg-gray-600" : "bg-gray-400"
          } ${isCreating ? "pointer-events-none" : ""}`}
          onMouseDown={handleMouseDown}
        />
        <button
          className={`absolute bottom-4 left-4 p-2 ${
            isDarkMode ? "bg-deep-dark" : "bg-light-white"
          } rounded-full focus:outline-none`}
          onClick={handleThemeToggle}
        >
          {isDarkMode ? (
            <IoSunny className="text-yellow-500" />
          ) : (
            <IoMoon className="text-blue-500" />
          )}
        </button>
      </aside>
      <main
        className={`flex-1 ${
          isDarkMode ? "bg-deep-dark" : "bg-light-gray"
        } p-4 overflow-auto`}
      >
        <>
          {activeTab === "containers" && !isFormVisible && (
            <ContainersScreen isCreating={isCreating} isDarkMode={isDarkMode} />
          )}
          {activeTab === "images" && !isFormVisible && (
            <ImagesScreen isDarkMode={isDarkMode} />
          )}
          {/* {activeTab === "settings" && !isFormVisible && <SettingsScreen />} */}
          {isFormVisible && (
            <CreateForm
              onSubmit={(
                e,
                containerName,
                technology,
                folder,
                port,
                templateType
              ) =>
                handleSubmit(
                  e,
                  containerName,
                  technology,
                  folder,
                  port,
                  templateType
                )
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
    e: React.FormEvent,
    containerName: string,
    technology: string,
    folder: string,
    ports: string,
    templateType: string
  ) => void;
}

const CreateForm: React.FC<CreateFormProps> = ({ onSubmit }) => {
  const [formType, setFormType] = useState<"package" | "template">("package");
  const [containerName, setContainerName] = useState("");
  const [technology, setTechnology] = useState("");
  const [folder, setFolder] = useState("");
  const [ports, setPorts] = useState("");
  const [templateName, setTemplateName] = useState("");
  const [templateType, setTemplateType] = useState("");
  const [templatePort, setTemplatePort] = useState("");

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

  const templateChoices = ["Next-js", "Next-ts", "Nest"];

  const handleFolderSelect = async () => {
    const selectedFolder = await SelectFolder();
    setFolder(selectedFolder);
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(
      e,
      containerName || templateName,
      technology || "none",
      folder,
      ports || templatePort,
      templateType
    );
  };

  return (
    <div className="rounded-lg border border-gray-300 text-white shadow-md p-4 space-y-4">
      <div className="flex space-x-4">
        <label className="flex items-center">
          <input
            type="radio"
            className="form-radio"
            name="formType"
            value="package"
            checked={formType === "package"}
            onChange={() => setFormType("package")}
          />
          <span className="ml-2">Package</span>
        </label>
        <label className="flex items-center">
          <input
            type="radio"
            className="form-radio"
            name="formType"
            value="template"
            checked={formType === "template"}
            onChange={() => setFormType("template")}
          />
          <span className="ml-2">Template</span>
        </label>
      </div>
      <form className="space-y-4" onSubmit={handleSubmitForm}>
        {formType === "package" && (
          <>
            <div>
              <label
                className="block text-sm font-medium"
                htmlFor="containerName"
              >
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
            <div>
              <label className="block text-sm font-medium" htmlFor="ports">
                Ports Number
              </label>
              <input
                id="ports"
                type="text"
                className="mt-1 block w-full p-2 border border-gray-300 rounded text-black"
                value={ports}
                onChange={(e) => setPorts(e.target.value)}
                placeholder="3000"
              />
            </div>
          </>
        )}
        {formType === "template" && (
          <>
            <div>
              <label
                className="block text-sm font-medium"
                htmlFor="templateName"
              >
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
              <label
                className="block text-sm font-medium"
                htmlFor="templateType"
              >
                Template
              </label>
              <select
                id="templateType"
                className="mt-1 block w-full p-2 border border-gray-300 rounded text-black"
                value={templateType}
                onChange={(e) => setTemplateType(e.target.value)}
                required
              >
                <option value="">Select Template</option>
                {templateChoices.map((choice, index) => (
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
            <div>
              <label
                className="block text-sm font-medium"
                htmlFor="templatePort"
              >
                Port Number
              </label>
              <input
                id="ports"
                type="text"
                className="mt-1 block w-full p-2 border border-gray-300 rounded text-black"
                value={ports}
                onChange={(e) => setPorts(e.target.value)}
                placeholder="3000"
                required
              />
            </div>
          </>
        )}
        <button
          type="submit"
          className="block w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          onClick={handleSubmitForm}
        >
          Create
        </button>
      </form>
    </div>
  );
};

const ContainersScreen: React.FC<{
  isCreating: boolean;
  isDarkMode: boolean;
}> = ({ isCreating, isDarkMode }) => {
  const [containers, setContainers] = useState<main.containerDetail[]>([]);

  const handleContainer = async () => {
    const containerData = await ListAllContainersJSON();
    setContainers(containerData || []);
    // console.log(JSON.stringify(containerData));
  };

  useEffect(() => {
    handleContainer();
    const interval = setInterval(handleContainer, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className={`h-full flex flex-col ${
        containers.length ? "overflow-hidden" : "overflow-auto"
      }`}
    >
      <h2 className="text-2xl font-bold mb-4">Containers</h2>
      {containers.length === 0 ? (
        <div className="flex-grow flex items-center justify-center pointer-events-none">
          <h1 className="opacity-50 text-2xl">No containers</h1>
        </div>
      ) : (
        <div className="flex-grow overflow-auto space-y-4">
          {isCreating ? <PlaceholderCard isCreating={isCreating} /> : null}
          {containers.map((container, index) => (
            <ContainerCard
              key={index}
              container={container}
              isDarkMode={isDarkMode}
            />
          ))}
        </div>
      )}
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
      {/* <p className="opacity-50 text-gray-400">Image: --</p>
      <p className="opacity-50 text-gray-400">Volume: --</p>
      <p className="opacity-50 text-gray-400">Created At: --</p>
      <p className="font-semibold text-gray-400">Status: --</p> */}
    </div>
    {isCreating && (
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r rounded-md from-white to-transparent pointer-events-none opacity-50 animate-ray" />
    )}
  </div>
);

const ContainerCard: React.FC<{
  container: main.containerDetail;
  isDarkMode: boolean;
}> = ({ container, isDarkMode }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleDeleteClick = async (
    id: string,
    status: string,
    event: React.MouseEvent
  ) => {
    event.stopPropagation();
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

  const handleControlClick = async (
    name: string,
    status: string,
    event: React.MouseEvent
  ) => {
    event.stopPropagation();
    if (status !== "Exited") {
      // Stop container
      await StopContainer(name);
    } else {
      // Start container
      const exposePort = window.confirm(
        "Do you want to expose any ports? Click OK to enter port numbers or Cancel to skip."
      );
      let ports = "";
      if (exposePort) {
        ports =
          window.prompt(
            "Enter the port numbers to expose, separated by commas (e.g., 8080,443):"
          ) || "";
      }
      await StartContainer(name, ports);
    }
  };

  return (
    <div
      className={`${
        isDarkMode ? "bg-gray-800 " : "bg-gray-500"
      } p-4 rounded-md flex flex-col justify-between items-start relative w-full md:flex-row md:items-center`}
    >
      <div className="flex-1">
        <div
          className="flex justify-between items-center cursor-pointer"
          onClick={() => setIsOpen(!isOpen)}
        >
          <div>
            <p className="font-bold text-xl">
              {container.name.length > 0 ? container.name : "No Name"}
            </p>
          </div>
          <div className="flex items-center">
            <div className="flex space-x-4">
              {container.status.slice(0, 6) !== "Exited" ? (
                <FaRegStopCircle
                  className="h-6 w-6 text-red-500 cursor-pointer"
                  onClick={(event) =>
                    handleControlClick(
                      container.id.slice(0, 9),
                      container.status.slice(0, 6),
                      event
                    )
                  }
                />
              ) : (
                <FiPlay
                  className={`h-6 w-6 ${
                    isDarkMode ? "text-green-500" : "text-green-500"
                  } cursor-pointer`}
                  onClick={(event) =>
                    handleControlClick(
                      container.name,
                      container.status.slice(0, 6),
                      event
                    )
                  }
                />
              )}
              <FiTrash2
                className={`h-6 w-6 ${
                  isDarkMode ? "text-red-500" : "text-red-600"
                } cursor-pointer`}
                onClick={(event) =>
                  handleDeleteClick(
                    container.name,
                    container.status.slice(0, 6),
                    event
                  )
                }
              />
              {container.url && container.status.slice(0, 6) !== "Exited" ? (
                <a
                  onClick={async (event) => {
                    event.stopPropagation();
                    await URL(container.url);
                  }}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white hover:text-blue-500 hover:cursor-pointer"
                >
                  <FiExternalLink className="w-6 h-6" />
                </a>
              ) : (
                <FiExternalLink className="text-gray-400 w-6 h-6 cursor-not-allowed" />
              )}
            </div>
            {isOpen ? (
              <FiChevronUp className="w-7 h-7 ml-4 mt-1" />
            ) : (
              <FiChevronDown className="w-7 h-7 ml-4 mt-1" />
            )}
          </div>
        </div>
        <div
          className={`mt-2 transition-max-height duration-300 ease-in-out overflow-hidden ${
            isOpen ? "max-h-screen" : "max-h-0"
          }`}
        >
          <p className="opacity-50">Id: {container.id.slice(0, 10)}</p>
          <p className="opacity-50">Image: {container.image}</p>
          <p className="opacity-50">Volume: {container.volume || "N/A"}</p>
          <p className="opacity-50">Created At: {container.created}</p>
          <p className="opacity-50">
            Ports:{" "}
            {container.public_ports ? container.public_ports.join(", ") : []}
          </p>
          <p
            className={`font-semibold ${
              container.status === "running"
                ? "text-green-500"
                : container.status.slice(0, 6) === "Exited"
                ? `${isDarkMode ? "text-red-500" : "text-red-700"}`
                : "text-green-500"
            }`}
          >
            Status: {container.status}
          </p>
        </div>
      </div>
    </div>
  );
};

const ImagesScreen: React.FC<{
  isDarkMode: boolean;
}> = ({ isDarkMode }) => {
  const [images, setImages] = useState<main.imageDetail[]>([]);

  const handleImages = async () => {
    const imageData = await ListImages();
    setImages(imageData || []);
    // console.log(JSON.stringify(imageData));
  };

  useEffect(() => {
    handleImages();
    const interval = setInterval(handleImages, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className={`h-full flex flex-col ${
        images && images.length ? "overflow-hidden" : "overflow-auto"
      }`}
    >
      <h2 className="text-2xl font-bold mb-4">Images</h2>
      {images && images.length === 0 ? (
        <div className="flex-grow flex items-center justify-center pointer-events-none">
          <h1 className="opacity-50 text-2xl">No images</h1>
        </div>
      ) : (
        <div className="flex-grow overflow-auto space-y-4">
          <ImageCard images={images} isDarkMode={isDarkMode} />
        </div>
      )}
    </div>
  );
};

const ImageCard: React.FC<{
  images: main.imageDetail[];
  isDarkMode: boolean;
}> = ({ images, isDarkMode }) => {
  const [usedImages, setUsedImages] = useState<string[]>([]);
  const [childImageCheck, setChildImageCheck] = useState<{
    [key: string]: boolean;
  }>({});
  const [expandedCards, setExpandedCards] = useState<{
    [key: string]: boolean;
  }>({});

  useEffect(() => {
    const fetchImageData = async () => {
      try {
        const containers = await ListAllContainersJSON();
        const usedIds = containers
          .filter((container) => container.status !== "Exited")
          .map((container) =>
            container.image_id.replace("sha256:", "").slice(0, 10)
          );
        setUsedImages(usedIds);

        const childCheckResults: { [key: string]: boolean } = {};
        for (const image of images) {
          const hasChildren = await CheckIfImageHasChildren(image.image_id);
          childCheckResults[image.image_id] = hasChildren;
        }
        setChildImageCheck(childCheckResults);
      } catch (error) {
        console.error("Error fetching image data:", error);
      }
    };

    fetchImageData();
  }, [images]);

  const isImageUsed = (imageId: string) => usedImages.includes(imageId);
  const hasChildImages = (imageId: string) => childImageCheck[imageId];

  const handleDeleteClick = async (imageId: string) => {
    if (isImageUsed(imageId)) {
      alert(
        "This image is being used by a container. Please remove the container first."
      );
      return;
    }

    if (hasChildImages(imageId)) {
      alert("This image has dependent child images and cannot be deleted.");
      return;
    }

    if (window.confirm("Are you sure you want to delete this image?")) {
      await RemoveImages(imageId, true, true);
    }
  };

  const toggleCard = (imageId: string) => {
    setExpandedCards((prev) => ({
      ...prev,
      [imageId]: !prev[imageId],
    }));
  };

  return (
    <>
      {images.map((image) => (
        <div
          key={image.image_id}
          className={`${
            isDarkMode ? "bg-gray-800 " : "bg-gray-500"
          } p-4 rounded-md mb-2 cursor-pointer`}
          onClick={() => toggleCard(image.image_id)}
        >
          <div className="flex justify-between items-center">
            <div>
              <p className="font-bold text-xl">{image.repository}</p>
            </div>
            <div className="flex items-center space-x-4">
              <FiTrash2
                className={`h-6 w-6 ${
                  isDarkMode ? "text-red-500" : "text-red-600"
                } cursor-pointer ${
                  isImageUsed(image.image_id) || hasChildImages(image.image_id)
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteClick(image.image_id);
                }}
              />
              {expandedCards[image.image_id] ? (
                <FiChevronUp className="h-6 w-6" />
              ) : (
                <FiChevronDown className="h-6 w-6" />
              )}
            </div>
          </div>
          <div
            className={`overflow-hidden transition-all duration-300 ${
              expandedCards[image.image_id] ? "max-h-96" : "max-h-0"
            }`}
          >
            <div className="mt-2">
              <p className="opacity-50">Tag: {image.tag}</p>
              <p className="opacity-50">ID: {image.image_id}</p>
              <p className="opacity-50">Size: {image.size}</p>
            </div>
          </div>
        </div>
      ))}
    </>
  );
};

const SettingsScreen: React.FC = () => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);

  const handleNotificationsToggle = () => {
    setNotificationsEnabled((prev) => !prev);
  };

  const handleDarkModeToggle = () => {
    setDarkModeEnabled((prev) => !prev);
    // You can add logic here to toggle dark mode in your app
  };

  return (
    <div style={{ maxWidth: 400, margin: "auto", padding: 16 }}>
      <h1 style={{ fontSize: 24, fontWeight: "bold", marginBottom: 16 }}>
        Settings
      </h1>
      <label
        style={{ display: "flex", alignItems: "center", marginBottom: 16 }}
      >
        <input
          type="checkbox"
          checked={notificationsEnabled}
          onChange={handleNotificationsToggle}
        />
        Enable Notifications
      </label>
      <label
        style={{ display: "flex", alignItems: "center", marginBottom: 16 }}
      >
        <input
          type="checkbox"
          checked={darkModeEnabled}
          onChange={handleDarkModeToggle}
        />
        Dark Mode
      </label>
      <button
        onClick={handleDarkModeToggle}
        disabled={darkModeEnabled}
        style={{
          padding: "8px 16px",
          fontSize: 16,
          cursor: "pointer",
          marginTop: 16,
        }}
      >
        {darkModeEnabled
          ? "Cleaning up..."
          : "Clean up inactive containers and images older than 1 week"}
      </button>
    </div>
  );
};

export default App;
