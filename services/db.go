package services

import (
	"fmt"
	"log"
	"net"
	"os"
	"os/exec"
	"strconv"
	"syscall"
)

func RunPostgresContainer(user, password, db, containerName string) (string, error) {
	freeport, err := findFreePort("5432")
	if err != nil {
		log.Fatal("Error while finding port", err)
	}
	cmd := exec.Command("docker", "run", "-d",
		"--label", "createdBy=DevBox",
		"-e", fmt.Sprintf("POSTGRES_USER=%s", user),
		"-e", fmt.Sprintf("POSTGRES_PASSWORD=%s", password),
		"-e", fmt.Sprintf("POSTGRES_DB=%s", db),
		"-p", fmt.Sprintf("%s:5432", freeport),
		"--name", containerName,
		"--restart", "unless-stopped",
		"-v", "postgres-data:/var/lib/postgresql/data",
		"--health-cmd", "pg_isready -U "+user+" -d "+db,
		"--health-interval", "10s",
		"--health-timeout", "5s",
		"--health-retries", "5",
		"postgres:alpine")

	output, err := cmd.CombinedOutput()
	if err != nil {
		return "", fmt.Errorf("failed to run Docker command: %v\nOutput: %s", err, output)
	}

	fmt.Printf("PostgreSQL container started successfully. Container ID: %s", output)
	return string(output), nil
}

func findFreePort(initialPort string) (string, error) {
	port, err := strconv.Atoi(initialPort)
	if err != nil {
		return "", fmt.Errorf("invalid port number: %v", err)
	}

	for {
		address := fmt.Sprintf(":%d", port)
		listener, err := net.Listen("tcp", address)
		if err != nil {
			if isAddrInUse(err) {
				port++
				continue
			}
			return "", fmt.Errorf("error checking port: %v", err)
		}
		listener.Close()
		return strconv.Itoa(port), nil
	}
}

func isAddrInUse(err error) bool {
	if opErr, ok := err.(*net.OpError); ok {
		if syscallErr, ok := opErr.Err.(*os.SyscallError); ok {
			return syscallErr.Err == syscall.EADDRINUSE
		}
	}
	return false
}
