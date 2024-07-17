package services

import (
	"fmt"
	"log"
	"net"
	"os"
	"os/exec"
	"strconv"
	"strings"
	"syscall"
)

var DesktopEnv string

func init() {
	DesktopEnv = getDesktopEnvironment()
}

func RunPostgresContainer(user, password, db, containerName string) (string, error) {
	freeport, err := findFreePort("5432")
	if err != nil {
		log.Fatal("Error while finding port", err)
	}
	command := fmt.Sprintf(`docker run -d \
	--label createdBy=DevBox \
	--label type=Database \
	--label dbuser=%s \
	-e POSTGRES_USER=%s \
	-e POSTGRES_PASSWORD=%s \
	-e POSTGRES_DB=%s \
	-e POSTGRES_ROOT_PASSWORD=root \
	-p %s:5432 \
	--name %s \
	--restart unless-stopped \
	--health-cmd "pg_isready -U %s -d %s" \
	--health-interval 10s \
	--health-timeout 5s \
	--health-retries 5 \
	postgres:alpine`,
		user, user, password, db, freeport, containerName, user, db)

	cmd := exec.Command("sh", "-c", command)

	output, err := cmd.CombinedOutput()
	if err != nil {
		return "", fmt.Errorf("failed to run Docker command: %v\nOutput: %s", err, output)
	}

	fmt.Printf("PostgreSQL container started successfully. Container ID: %s", output)
	return string(output), nil
}

func ConnectToPostgres(contName, dbuser string) {
	cmd := fmt.Sprintf("docker exec -it %s psql -U %s", contName, dbuser)
	openTerminal(cmd)
}

func openTerminal(cmd string) {
	var pkexecCmd *exec.Cmd

	switch DesktopEnv {
	case "xfce":
		pkexecCmd = exec.Command("xfce4-terminal", "-e", cmd)
		if err := pkexecCmd.Run(); err != nil {
			fmt.Printf("Error executing command: %v\n", err)
		}
	case "gnome":
		pkexecCmd = exec.Command("gnome-terminal", "--", cmd)
		if err := pkexecCmd.Run(); err != nil {
			fmt.Printf("Error executing command: %v\n", err)
		}
	case "kde":
		pkexecCmd = exec.Command("konsole", "-e", cmd)
		if err := pkexecCmd.Run(); err != nil {
			fmt.Printf("Error executing command: %v\n", err)
		}
	default:
		fmt.Printf("unsupported desktop environment: %s\n", DesktopEnv)
		if err := pkexecCmd.Run(); err != nil {
			fmt.Printf("Error executing command: %v\n", err)
		}
	}
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

func getDesktopEnvironment() string {
	return strings.ToLower(os.Getenv("XDG_CURRENT_DESKTOP"))
}
