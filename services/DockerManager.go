package services

import (
	"archive/tar"
	"bytes"
	"context"
	"fmt"
	"io"
	"log"
	"math/rand"
	"net"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/docker/docker/api/types"
	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/client"
	"github.com/docker/go-connections/nat"
	"gopkg.in/yaml.v3"
)

type DockerCreate struct {
	cli        *client.Client
	configPath string
}

func NewDockerCreate() (*DockerCreate, error) {
	cli, err := client.NewClientWithOpts(client.FromEnv)
	if err != nil {
		return nil, fmt.Errorf("failed to create Docker client: %v", err)
	}

	// configDir, err := os.UserConfigDir()
	configDir, err := os.Getwd()
	if err != nil {
		return nil, fmt.Errorf("failed to get user config directory: %v", err)
	}

	configPath := filepath.Join(configDir, "wails-docker-manager.yaml")

	return &DockerCreate{
		cli:        cli,
		configPath: configPath,
	}, nil
}

func (dc *DockerCreate) LoadContainerInfo() (*ContainerInfo, error) {
	data, err := os.ReadFile(dc.configPath)
	if err != nil {
		if os.IsNotExist(err) {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to read container info: %v", err)
	}

	var info ContainerInfo
	err = yaml.Unmarshal(data, &info)
	if err != nil {
		return nil, fmt.Errorf("failed to unmarshal container info: %v", err)
	}

	return &info, nil
}

func isPortInUse(port int) bool {
	ln, err := net.Listen("tcp", fmt.Sprintf(":%d", port))
	if err != nil {
		return true
	}
	ln.Close()
	return false
}

func findAvailablePort(startPort int) int {
	port := startPort
	for isPortInUse(port) {
		port++
	}
	return port
}

func generateRandomString(length int) string {
	const charset = "abcdefghijklmnopqrstuvwxyz0123456789"
	seededRand := rand.New(rand.NewSource(time.Now().UnixNano()))
	b := make([]byte, length)
	for i := range b {
		b[i] = charset[seededRand.Intn(len(charset))]
	}
	return string(b)
}

func (dc *DockerCreate) CreateContainer(name, technology, volume, additionalPorts, templateName string) error {
	ctx := context.Background()

	// Check if a container with the same name already exists
	containers, err := dc.cli.ContainerList(ctx, container.ListOptions{All: true})
	if err != nil {
		return fmt.Errorf("failed to list containers: %v", err)
	}
	for _, container := range containers {
		if container.Names[0] == "/"+name {
			fmt.Printf("Container with name %s already exists. Skipping creation.\n", name)
			return nil
		}
	}

	// Generate image name
	imageName := fmt.Sprintf("%s-%s", name, generateRandomString(8))

	// Building Docker image
	buildArgs := map[string]*string{
		"ADDITIONAL_PACKAGES": &technology,
		"ADDITIONAL_PORT":     &additionalPorts,
		"TEMPLATE_NAME":       &templateName,
	}
	dockerfilePath := "/usr/local/share/contanize/dockerfile"
	fmt.Println("Dockerfile path:", dockerfilePath)

	var buf bytes.Buffer
	tw := tar.NewWriter(&buf)

	buildContext := "/usr/local/share/contanize/"
	err = filepath.Walk(buildContext, func(file string, fi os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		header, err := tar.FileInfoHeader(fi, fi.Name())
		if err != nil {
			return err
		}
		relPath, err := filepath.Rel(buildContext, file)
		if err != nil {
			return err
		}
		header.Name = relPath
		if err := tw.WriteHeader(header); err != nil {
			return err
		}
		if fi.Mode().IsRegular() {
			f, err := os.Open(file)
			if err != nil {
				return err
			}
			defer f.Close()
			if _, err := io.Copy(tw, f); err != nil {
				return err
			}
		}
		return nil
	})
	if err != nil {
		return fmt.Errorf("error creating tarball: %v", err)
	}
	if err := tw.Close(); err != nil {
		return fmt.Errorf("error closing tar writer: %v", err)
	}

	buildOptions := types.ImageBuildOptions{
		Dockerfile: "dockerfile",
		Tags:       []string{imageName},
		BuildArgs:  buildArgs,
		NoCache:    true,
		Remove:     true,
	}
	response, err := dc.cli.ImageBuild(ctx, &buf, buildOptions)
	if err != nil {
		return fmt.Errorf("failed to build Docker image: %v", err)
	}
	defer response.Body.Close()

	buildOutput := new(bytes.Buffer)
	if _, err := io.Copy(buildOutput, response.Body); err != nil {
		return fmt.Errorf("error reading build output: %v", err)
	}
	fmt.Println("Build output:", buildOutput.String())

	portMappings := make(map[string]string)
	portBindings := nat.PortMap{}
	exposedPorts := nat.PortSet{}

	// Handling main port (8080)
	mainExternalPort := findAvailablePort(8080)
	portMappings["8080"] = strconv.Itoa(mainExternalPort)
	portBindings[nat.Port("8080")] = []nat.PortBinding{{HostIP: "0.0.0.0", HostPort: strconv.Itoa(mainExternalPort)}}
	exposedPorts[nat.Port("8080")] = struct{}{}

	// Handling additional ports
	additionalPortsList := strings.Split(additionalPorts, ",")
	for _, internalPort := range additionalPortsList {
		if internalPort != "" {
			internalPort = strings.TrimSpace(internalPort)
			if internalPort == "" {
				continue
			}
			portInt, _ := strconv.Atoi(internalPort)
			externalPort := findAvailablePort(portInt)
			portMappings[internalPort] = strconv.Itoa(externalPort)
			portBindings[nat.Port(internalPort)] = []nat.PortBinding{{HostIP: "0.0.0.0", HostPort: strconv.Itoa(externalPort)}}
			exposedPorts[nat.Port(internalPort)] = struct{}{}
		}
	}

	resp, err := dc.cli.ContainerCreate(ctx, &container.Config{
		Image:        imageName,
		ExposedPorts: exposedPorts,
		Cmd:          []string{templateName},
	}, &container.HostConfig{
		PortBindings: portBindings,
		Binds:        []string{volume + ":/home/coder"},
		Privileged:   true,
	}, nil, nil, name)
	if err != nil {
		return fmt.Errorf("failed to create container: %v", err)
	}

	if err := dc.cli.ContainerStart(ctx, resp.ID, container.StartOptions{}); err != nil {
		return fmt.Errorf("failed to start container: %v", err)
	}

	info := ContainerInfo{
		ContainerID: resp.ID,
		Name:        name,
		Image:       imageName,
		Ports:       portMappings,
		Volume:      volume,
		Template:    templateName,
	}
	pathName, _ := os.Getwd()
	transaction, err := NewTransaction(filepath.Join(pathName, "info.yaml"))
	if err != nil {
		log.Fatalf("Error beginning transaction: %v", err)
	}
	defer transaction.rollback()
	transaction.CreateEntry(info)
	if err := transaction.commit(); err != nil {
		log.Fatalf("Error committing transaction: %v", err)
	}

	fmt.Printf("Container %s started successfully with ports %v\n", name, portMappings)
	return nil
}

func (dc *DockerCreate) StopContainer(name string) error {
	ctx := context.Background()

	if err := dc.cli.ContainerStop(ctx, name, container.StopOptions{}); err != nil {
		return fmt.Errorf("failed to stop container: %v", err)
	}

	if err := dc.cli.ContainerRemove(ctx, name, container.RemoveOptions{}); err != nil {
		return fmt.Errorf("failed to remove container: %v", err)
	}

	fmt.Printf("Container %s stopped and removed successfully\n", name)
	return nil
}

func CreateContainer(name, technology, volume, additionalPorts, templateName string) error {
	dc, err := NewDockerCreate()
	if err != nil {
		return err
	}
	return dc.CreateContainer(name, technology, volume, additionalPorts, templateName)
}

func StopContainer(name string) error {
	dc, err := NewDockerCreate()
	if err != nil {
		return err
	}
	return dc.StopContainer(name)
}
