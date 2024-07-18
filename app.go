package main

import (
	"context"
	"devbox/services"
	"encoding/json"
	"fmt"
	"log"
	"math"
	"os/exec"
	"strconv"
	"strings"
	"time"

	"github.com/wailsapp/wails/v2/pkg/runtime"

	"github.com/docker/docker/api/types"
	containertypes "github.com/docker/docker/api/types/container"
	"github.com/docker/docker/api/types/filters"

	imagetype "github.com/docker/docker/api/types/image"
	"github.com/docker/docker/client"
)

// App struct
type App struct {
	ctx context.Context
}

type containerDetail struct {
	Id          string   `json:"id"`
	Name        string   `json:"name"`
	Image       string   `json:"image"`
	ImageId     string   `json:"image_id"`
	Volume      string   `json:"volume"`
	Created     string   `json:"created"`
	Status      string   `json:"status"`
	URL         string   `json:"url"`
	PublicPorts []string `json:"public_ports"`
	IsDatabase  bool     `json:"isdatabase"`
	DBUser      string   `json:"dbuser"`
	DB          string   `json:"db"`
	DBPass      string   `json:"dbpass"`
}

type Port struct {
	IP         string
	PublicPort int
}

type imageDetail struct {
	Repository string `json:"repository"`
	Tag        string `json:"tag"`
	ImageID    string `json:"image_id"`
	Created    string `json:"created"`
	Size       string `json:"size"`
	Arch       string `json:"arch"`
	Os         string `json:"os"`
}

type LayerInfo struct {
	ID   string `json:"id"`
	Size int64  `json:"size"`
}

type CPUStats struct {
	Time  string `json:"time"`
	Usage string `json:"usage"`
}

type MemoryStats struct {
	Time  string `json:"time"`
	Usage string `json:"usage"`
}

type ContainerMetrics struct {
	CPUUsage         string `json:"cpuUsage"`
	MemoryUsage      string `json:"memoryUsage"`
	NetworkInput     string `json:"networkInput"`
	NetworkOutput    string `json:"networkOutput"`
	DiskIO           string `json:"diskIO"`
	RunningProcesses string `json:"runningProcesses"`
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// startup is called at application startup
func (a *App) startup(ctx context.Context) {
	// Perform your setup here
	a.ctx = ctx
}

// domReady is called after front-end resources have been loaded
func (a App) domReady(ctx context.Context) {
	// Add your action here
}

// beforeClose is called when the application is about to quit,
// either by clicking the window close button or calling runtime.Quit.
// Returning true will cause the application to continue, false will continue shutdown as normal.
func (a *App) beforeClose(ctx context.Context) (prevent bool) {
	return false
}

// shutdown is called at application termination
func (a *App) shutdown(ctx context.Context) {
	// Perform your teardown here
}

// Greet returns a greeting for the given name
func (a *App) Greet(name string) string {
	return fmt.Sprintf("Hello %s, It's show time!", name)
}

func (a *App) SelectFolder() string {
	dir, err := runtime.OpenDirectoryDialog(a.ctx, runtime.OpenDialogOptions{
		Title:           "Select Folder",
		ShowHiddenFiles: true,
	})

	if err != nil {
		return "Something occured while opening"
	}

	return dir
}

func (a *App) ListAllContainersJSON() []containerDetail {
	ctx := context.Background()
	cli, err := client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
	if err != nil {
		return nil
	}
	defer cli.Close()

	filters := filters.NewArgs(
		filters.Arg("label", "createdBy=DevBox"),
	)
	containers, err := cli.ContainerList(ctx, containertypes.ListOptions{All: true, Filters: filters})
	if err != nil {
		return nil
	}
	volumeWidth := maxVolumeWidth(containers)

	if len(containers) == 0 {
		return nil
	}

	var containerInfo []containerDetail

	for _, container := range containers {
		var url string
		if len(container.Ports) > 0 {
			for _, port := range container.Ports {
				if strings.HasPrefix(strconv.Itoa(int(port.PublicPort)), "80") {
					url = fmt.Sprintf("http://%s:%d", port.IP, port.PublicPort)
					break
				}
			}
		}
		if url == "" {
			url = "Not Available"
		}
		containerID := container.ID
		image := truncateString(container.Image, 20)
		imageID := container.ImageID
		volume := "Not Available"
		if len(container.Mounts) > 0 {
			volume = truncateString(container.Mounts[0].Source, volumeWidth)
		}
		created := truncateString(time.Unix(container.Created, 0).Format("2006-01-02 15:04:05"), 20)
		status := container.Status
		names := "Not Available"
		if len(container.Names) > 0 {
			names = truncateString(container.Names[0][1:], 20)
		}

		portMap := make(map[string]bool)
		var publicPorts []string
		for _, port := range container.Ports {
			if port.PublicPort != 0 {
				portStr := strconv.Itoa(int(port.PublicPort))
				if !portMap[portStr] {
					publicPorts = append(publicPorts, portStr)
					portMap[portStr] = true
				}
			}
		}

		isDatabase := false
		DBUser := "none"
		DB := ""
		DBPass := ""
		if container.Labels != nil {
			for k, v := range container.Labels {
				// fmt.Printf("key[%s] value[%s]\n", k, v)
				if strings.Contains(v, "Database") {
					isDatabase = true
				}

				if strings.Contains(k, "dbuser") {
					DBUser = v
				}

				if strings.Contains(v, "mongo") {
					DB = "mongo"
				}

				if strings.Contains(v, "postgres") {
					DB = "postgres"
				}

				if strings.Contains(k, "dbpass") {
					DBPass = v
				}
			}
		}

		containerInfo = append(containerInfo, containerDetail{
			Id:          containerID[:10],
			Image:       image,
			ImageId:     imageID,
			Volume:      volume,
			Created:     created,
			Status:      status,
			Name:        names,
			URL:         url,
			PublicPorts: publicPorts,
			IsDatabase:  isDatabase,
			DBUser:      DBUser,
			DB:          DB,
			DBPass:      DBPass,
		})
	}
	// fmt.Println(containerInfo)
	return containerInfo
}

func (a *App) URL(url string) {
	cmd := exec.Command("xdg-open", url)
	err := cmd.Run()
	if err != nil {
		fmt.Println("URL Error: " + err.Error())
	}
}

func (a *App) CreateCodeInstance(name string, packageName string, folder string, ports string, template string) (string, error) {
	var output []byte
	if strings.Contains(template, "next-js") {
		err := services.CreateContainer(strings.ToLower(name), "nodelts", folder, ports, template)
		if err != nil {
			fmt.Printf("error executing the script: %s", err)
		}
	} else if strings.Contains(template, "next-ts") {
		err := services.CreateContainer(strings.ToLower(name), "nodelts", folder, ports, template)
		if err != nil {
			fmt.Printf("error executing the script: %s", err)
		}
	} else if strings.Contains(template, "nest") {
		err := services.CreateContainer(strings.ToLower(name), "nodelts", folder, ports, template)
		if err != nil {
			fmt.Printf("error executing the script: %s", err)
		}
	} else if strings.Contains(template, "goftt") {
		err := services.CreateContainer(strings.ToLower(name), "go", folder, ports, template)
		if err != nil {
			fmt.Printf("error executing the script: %s", err)
		}
	} else {
		err := services.CreateContainer(strings.ToLower(name), packageName, folder, ports, "none")
		if err != nil {
			fmt.Printf("error executing the script: %s", err)
		}
	}
	outputLines := strings.Split(strings.TrimSpace(string(output)), "\n")
	containerId := outputLines[len(outputLines)-1]

	return containerId, nil
}

func (a *App) RemoveContainer(id string, force bool) {
	ctx := context.Background()
	cli, err := client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
	if err != nil {
		fmt.Println("Error connecting to Docker")
	}

	err = cli.ContainerRemove(ctx, id, containertypes.RemoveOptions{Force: force})
	if err != nil {
		fmt.Println("Container must be forced to remove")
		fmt.Println(err)
	}
	fmt.Println("Container removed: " + id)
}

func (a *App) ForceRemoveContainer(id string) {
	ctx := context.Background()
	cli, err := client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
	if err != nil {
		fmt.Println("Error connecting to Docker")
	}
	err = cli.ContainerRemove(ctx, id, containertypes.RemoveOptions{Force: true})
	if err != nil {
		fmt.Println("Container must be forced to remove")
		fmt.Println(err)
	}
	fmt.Println("Container removed: " + id)
}

func (a *App) StartContainer(name string, port string) string {
	err := services.StartContainer(name, port)
	if err != nil {
		fmt.Printf("Error starting container: %v\n", err)
	}
	return "Success"
}

func (a *App) StopContainer(name string) string {
	ctx := context.Background()
	cli, err := client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
	if err != nil {
		return "Failed - 1"
	}
	defer cli.Close()

	contInfo, err := cli.ContainerInspect(ctx, name)
	if err != nil {
		return "Failed - 2"
	}
	if contInfo.State.Running {
		err = cli.ContainerStop(ctx, name, containertypes.StopOptions{})
		if err != nil {
			return "Failed - 3"
		}
	}
	return "Success"
}

func (a *App) ListImages() []imageDetail {
	ctx := context.Background()
	cli, err := client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
	if err != nil {
		return nil
	}
	defer cli.Close()
	filters := filters.NewArgs(filters.Arg("label", "createdBy=DevBox"))
	images, err := cli.ImageList(ctx, imagetype.ListOptions{Filters: filters})
	if err != nil {
		return nil
	}

	const (
		repositoryWidth = 30
		tagWidth        = 20
		imageIDWidth    = 20
		createdWidth    = 25
		sizeWidth       = 15
	)

	var imageDetails []imageDetail

	for _, image := range images {
		var imageName, tag string
		imageInspect, _, err := cli.ImageInspectWithRaw(ctx, image.ID)
		if err != nil {
			log.Fatal("Error while Inspecting Image in ListImages")
		}
		if len(image.RepoDigests) > 0 && len(image.RepoTags) > 0 {
			imageNameParts := strings.Split(image.RepoDigests[0], "@")
			imageName = truncateString(imageNameParts[0], repositoryWidth)
			tag = truncateString(getTag(image.RepoTags[0]), tagWidth)
		} else if len(image.RepoTags) > 0 {
			imageNameParts := strings.Split(image.RepoTags[0], ":")
			imageName = truncateString(imageNameParts[0], repositoryWidth)
			tag = truncateString(imageNameParts[1], tagWidth)
		} else {
			imageName = "<none>"
			tag = "<none>"
		}
		imageID := strings.ReplaceAll(image.ID, "sha256:", "")[0:10]
		created := truncateString(time.Unix(image.Created, 0).Format("2006-01-02 15:04:05"), createdWidth)
		size := truncateString(formatSize(image.Size), sizeWidth)
		arch := imageInspect.Architecture
		os := imageInspect.Os

		imageDetails = append(imageDetails, imageDetail{
			Repository: imageName,
			Tag:        tag,
			ImageID:    imageID,
			Created:    created,
			Size:       size,
			Arch:       arch,
			Os:         os,
		})
	}

	return imageDetails
}

func (a *App) RemoveImages(id string, force bool, prune bool) {
	ctx := context.Background()
	cli, err := client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
	if err != nil {
		fmt.Println("Error connecting to Docker")
	}

	images, err := cli.ImageRemove(ctx, id, imagetype.RemoveOptions{Force: force, PruneChildren: prune})
	if err != nil {
		fmt.Println(err)
	}
	fmt.Println(images[1].Deleted)
}

func (a *App) GetImageLayerSize(imageName string) ([]LayerInfo, error) {
	ctx := context.Background()
	cli, err := client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
	if err != nil {
		fmt.Println("Error connecting to Docker")
	}
	imageInspect, _, err := cli.ImageInspectWithRaw(ctx, imageName)
	if err != nil {
		return nil, err
	}

	// Fetching image history
	imageHistory, err := cli.ImageHistory(ctx, imageInspect.ID)
	if err != nil {
		return nil, err
	}

	// Collecting non-zero layers
	var layers []LayerInfo
	for _, history := range imageHistory {
		layerSizeMB := history.Size / (1024 * 1024)
		if layerSizeMB != 0 {
			layerID := history.ID
			layers = append(layers, LayerInfo{
				ID:   layerID,
				Size: layerSizeMB,
			})
		}
	}

	return layers, nil
}

func (a *App) GetCPUStats(containerID string) []CPUStats {
	cli, err := client.NewClientWithOpts(client.FromEnv)
	if err != nil {
		log.Printf("error creating Docker client: %v", err)
		return []CPUStats{}
	}
	defer cli.Close()

	// If Container exists
	_, err = cli.ContainerInspect(context.Background(), containerID)
	if err != nil {
		if client.IsErrNotFound(err) {
			return []CPUStats{}
		}
		log.Printf("error inspecting container: %v", err)
		return []CPUStats{}
	}

	// Container state
	containerInfo, err := cli.ContainerInspect(context.Background(), containerID)
	if err != nil {
		log.Printf("error inspecting container: %v", err)
		return []CPUStats{}
	}
	if !containerInfo.State.Running {
		return []CPUStats{}
	}

	// Get initial stats
	stats, err := cli.ContainerStats(context.Background(), containerID, false)
	if err != nil {
		log.Printf("error getting container stats: %v", err)
		return []CPUStats{}
	}
	defer stats.Body.Close()

	var initialStats types.StatsJSON
	if err := json.NewDecoder(stats.Body).Decode(&initialStats); err != nil {
		log.Printf("error decoding initial stats JSON: %v", err)
		return []CPUStats{}
	}

	// Wait for a short duration to get a second sample
	time.Sleep(1 * time.Second)

	// Get updated stats
	stats, err = cli.ContainerStats(context.Background(), containerID, false)
	if err != nil {
		log.Printf("error getting updated container stats: %v", err)
		return []CPUStats{}
	}
	defer stats.Body.Close()

	var updatedStats types.StatsJSON
	if err := json.NewDecoder(stats.Body).Decode(&updatedStats); err != nil {
		log.Printf("error decoding updated stats JSON: %v", err)
		return []CPUStats{}
	}

	// Calculate CPU usage
	cpuDelta := float64(updatedStats.CPUStats.CPUUsage.TotalUsage - initialStats.CPUStats.CPUUsage.TotalUsage)
	systemDelta := float64(updatedStats.CPUStats.SystemUsage - initialStats.CPUStats.SystemUsage)
	cpuUsage := 0.0
	if systemDelta > 0 {
		cpuUsage = (cpuDelta / systemDelta) * float64(len(updatedStats.CPUStats.CPUUsage.PercpuUsage)) * 100.0
	}

	return []CPUStats{
		{
			Time:  time.Now().Format(time.RFC3339),
			Usage: fmt.Sprintf("%.2f%%", cpuUsage),
		},
	}
}

func (a *App) GetMemoryStats(containerID string) []MemoryStats {
	cli, err := client.NewClientWithOpts(client.FromEnv)
	if err != nil {
		log.Printf("error creating Docker client: %v", err)
		return []MemoryStats{}
	}
	defer cli.Close()

	// If Container exists
	_, err = cli.ContainerInspect(context.Background(), containerID)
	if err != nil {
		if client.IsErrNotFound(err) {
			// log.Printf("Container %s does not exist. Skipping memory stats collection.", containerID)
			return []MemoryStats{}
		}
		log.Printf("error inspecting container: %v", err)
		return []MemoryStats{}
	}

	// Container state
	containerInfo, err := cli.ContainerInspect(context.Background(), containerID)
	if err != nil {
		log.Printf("error inspecting container: %v", err)
		return []MemoryStats{}
	}

	if !containerInfo.State.Running {
		// log.Printf("Container %s is not running. Skipping memory stats collection.", containerID)
		return []MemoryStats{}
	}

	stats, err := cli.ContainerStats(context.Background(), containerID, false)
	if err != nil {
		log.Printf("error getting container stats: %v", err)
		return []MemoryStats{}
	}
	defer stats.Body.Close()

	var statsJSON types.StatsJSON
	if err := json.NewDecoder(stats.Body).Decode(&statsJSON); err != nil {
		log.Printf("error decoding stats JSON: %v", err)
		return []MemoryStats{}
	}

	memoryUsage := statsJSON.MemoryStats.Usage
	var usageString string
	if memoryUsage > 1024*1024*1024 {
		usageString = fmt.Sprintf("%.2f GB", float64(memoryUsage)/(1024*1024*1024))
	} else {
		usageString = fmt.Sprintf("%.2f MB", float64(memoryUsage)/(1024*1024))
	}

	return []MemoryStats{
		{
			Time:  time.Now().Format(time.RFC3339),
			Usage: usageString,
		},
	}
}

func (a *App) GetContainerMetrics(containerID string) (ContainerMetrics, error) {
	ctx := context.Background()
	cli, err := client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
	if err != nil {
		return ContainerMetrics{}, fmt.Errorf("error creating Docker client: %v", err)
	}
	defer cli.Close()

	stats, err := cli.ContainerStats(ctx, containerID, false)
	if err != nil {
		return ContainerMetrics{}, fmt.Errorf("error getting container stats: %v", err)
	}
	defer stats.Body.Close()

	var statsJSON types.StatsJSON
	if err := json.NewDecoder(stats.Body).Decode(&statsJSON); err != nil {
		return ContainerMetrics{}, fmt.Errorf("error decoding stats JSON: %v", err)
	}

	// Calculate CPU usage percentage
	cpuDelta := float64(statsJSON.CPUStats.CPUUsage.TotalUsage - statsJSON.PreCPUStats.CPUUsage.TotalUsage)
	systemDelta := float64(statsJSON.CPUStats.SystemUsage - statsJSON.PreCPUStats.SystemUsage)
	cpuUsage := (cpuDelta / systemDelta) * float64(len(statsJSON.CPUStats.CPUUsage.PercpuUsage)) * 100.0

	// Calculate memory usage in percentage
	memoryUsage := float64(statsJSON.MemoryStats.Usage) / float64(statsJSON.MemoryStats.Limit) * 100.0

	// Calculate network I/O in MB/s
	networkInput := float64(statsJSON.Networks["eth0"].RxBytes) / (1024 * 1024)
	networkOutput := float64(statsJSON.Networks["eth0"].TxBytes) / (1024 * 1024)

	// Calculate disk I/O in MB/s
	var readIO, writeIO uint64
	for _, blkio := range statsJSON.BlkioStats.IoServiceBytesRecursive {
		if blkio.Op == "Read" {
			readIO += blkio.Value
		}
		if blkio.Op == "Write" {
			writeIO += blkio.Value
		}
	}
	diskIO := float64(readIO+writeIO) / (1024 * 1024)

	// Get number of running processes
	runningProcesses := statsJSON.PidsStats.Current

	return ContainerMetrics{
		CPUUsage:         fmt.Sprintf("%.2f", math.Min(cpuUsage, 100)),
		MemoryUsage:      fmt.Sprintf("%.2f", math.Min(memoryUsage, 100)),
		NetworkInput:     fmt.Sprintf("%.2f", networkInput),
		NetworkOutput:    fmt.Sprintf("%.2f", networkOutput),
		DiskIO:           fmt.Sprintf("%.2f", diskIO),
		RunningProcesses: fmt.Sprintf("%d", runningProcesses),
	}, nil
}

func (a *App) CreateDB(dbtype, username, password, dbname, contname string) string {
	switch dbtype {
	case "postgres":
		id, err := services.RunPostgresContainer(username, password, dbname, contname)
		if err != nil {
			log.Fatal("Error occured while creating Postgres Instance", err)
		}
		return id
	case "mongo":
		id, err := services.RunMongoContainer(username, password, dbname, contname)
		if err != nil {
			log.Fatal("Error occured while creating Postgres Instance", err)
		}
		return id
	default:
		return "No Container Created"
	}
}

func (a *App) OpenPostgresTerminal(contName, dbuser string) {
	services.ConnectToPostgres(contName, dbuser)
}

func (a *App) OpenMongoTerminal(contName, dbuser string) {
	services.ConnectToMongo(contName, dbuser)
}

func truncateString(s string, maxLength int) string {
	if len(s) > maxLength {
		return s[:maxLength-3] + "..."
	}
	return s
}

func maxVolumeWidth(containers []types.Container) int {
	maxWidth := 0
	for _, container := range containers {
		if len(container.Mounts) > 0 {
			if len(container.Mounts[0].Source) > maxWidth {
				maxWidth = len(container.Mounts[0].Source)
			}
		}
	}
	return maxWidth
}

func getTag(repoTag string) string {
	parts := strings.SplitN(repoTag, ":", 2)
	if len(parts) == 2 {
		return parts[1]
	}
	return "latest"
}

func formatSize(size int64) string {
	const unit = 1024
	if size < unit {
		return fmt.Sprintf("%d B", size)
	}
	div, exp := int64(unit), 0
	for n := size / unit; n >= unit; n /= unit {
		div *= unit
		exp++
	}
	return fmt.Sprintf("%.1f %cB", float64(size)/float64(div), "KMGTPE"[exp])
}
