package services

import (
	"context"
	"fmt"
	"log"
	"net"
	"strconv"
	"strings"

	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/client"
	"github.com/docker/go-connections/nat"
)

type DockerStarter struct {
	cli *client.Client
	ctx context.Context
}

func NewDockerStarter() (*DockerStarter, error) {
	cli, err := client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
	if err != nil {
		return nil, fmt.Errorf("failed to create Docker client: %v", err)
	}
	return &DockerStarter{
		cli: cli,
		ctx: context.Background(),
	}, nil
}

func (ds *DockerStarter) GetContainerInfo(containerName string) (string, string, map[string]string, error) {
	container, err := ds.cli.ContainerInspect(ds.ctx, containerName)
	if err != nil {
		return "", "", nil, fmt.Errorf("failed to inspect container: %v", err)
	}

	image := container.Config.Image
	var volume string
	if len(container.Mounts) > 0 {
		volume = container.Mounts[0].Source
	}
	labels := container.Config.Labels

	return image, volume, labels, nil
}

func (ds *DockerStarter) FindAvailablePort(startPort int) int {
	for port := startPort; ; port++ {
		addr := fmt.Sprintf(":%d", port)
		listener, err := net.Listen("tcp", addr)
		if err == nil {
			listener.Close()
			return port
		}
	}
}

func (ds *DockerStarter) CommitContainer(containerName, newImageName string) error {
	_, err := ds.cli.ContainerCommit(ds.ctx, containerName, container.CommitOptions{Reference: newImageName})
	return err
}

func (ds *DockerStarter) RemoveContainer(containerName string) error {
	return ds.cli.ContainerRemove(ds.ctx, containerName, container.RemoveOptions{Force: true})
}

func (ds *DockerStarter) RunContainer(containerName, image, volume string, ports map[string]string) error {
	portBindings := nat.PortMap{}
	exposedPorts := nat.PortSet{}

	for internalPort, externalPort := range ports {
		port, err := nat.NewPort("tcp", internalPort)
		if err != nil {
			return fmt.Errorf("failed to create port: %v", err)
		}

		portBindings[port] = []nat.PortBinding{{HostIP: "0.0.0.0", HostPort: externalPort}}
		exposedPorts[port] = struct{}{}
	}

	resp, err := ds.cli.ContainerCreate(ds.ctx, &container.Config{
		Image:        image,
		ExposedPorts: exposedPorts,
	}, &container.HostConfig{
		PortBindings: portBindings,
		Binds:        []string{volume + ":/home/coder"},
		Privileged:   true,
	}, nil, nil, containerName)
	if err != nil {
		return fmt.Errorf("failed to create container: %v", err)
	}

	if err := ds.cli.ContainerStart(ds.ctx, resp.ID, container.StartOptions{}); err != nil {
		return fmt.Errorf("failed to start container: %v", err)
	}

	return nil
}

func (ds *DockerStarter) StartContainer(containerName string, additionalPorts string) error {
	image, volume, labels, err := ds.GetContainerInfo(containerName)
	if err != nil {
		return err
	}

	ports := make(map[string]string)
	defaultPortAssigned := false

	for _, v := range labels {
		if strings.Contains(v, "postgres") {
			ports["5432"] = strconv.Itoa(ds.FindAvailablePort(5432))
			defaultPortAssigned = true
			break
		}
		if strings.Contains(v, "mongo") {
			ports["27017"] = strconv.Itoa(ds.FindAvailablePort(27017))
			defaultPortAssigned = true
			break
		}
	}

	if !defaultPortAssigned {
		ports["8080"] = strconv.Itoa(ds.FindAvailablePort(8080))
	}

	additionalPortsSlice := strings.Split(additionalPorts, ",")
	for _, p := range additionalPortsSlice {
		inPort, err := strconv.Atoi(p)
		if err != nil {
			log.Fatal("Cannot convert Port to Int")
		}
		availablePort := ds.FindAvailablePort(inPort)
		ports[p] = strconv.Itoa(availablePort)
	}

	var portsStr []string
	for internalPort, externalPort := range ports {
		portsStr = append(portsStr, fmt.Sprintf("%s:%s", externalPort, internalPort))
	}
	fmt.Printf("Launching %s on ports %s and mounting %s\n", containerName, strings.Join(portsStr, ","), volume)

	if err := ds.CommitContainer(containerName, image); err != nil {
		return fmt.Errorf("failed to commit container: %v", err)
	}

	if err := ds.RemoveContainer(containerName); err != nil {
		return fmt.Errorf("failed to remove container: %v", err)
	}

	if err := ds.RunContainer(containerName, image, volume, ports); err != nil {
		return fmt.Errorf("failed to run container: %v", err)
	}

	return nil
}

func StartContainer(contName, port string) error {
	ds, err := NewDockerStarter()
	if err != nil {
		fmt.Printf("Error creating Docker Starter: %v\n", err)
		return err
	}
	err = ds.StartContainer(contName, port)
	if err != nil {
		fmt.Printf("Error starting container: %v\n", err)
		return err
	}
	return nil
}
