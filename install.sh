#!/usr/bin/env sh
# Copyright 2024-present devbox contributors.

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# Function to check Linux distribution
check_distro() {
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        DISTRO=$ID
    elif [ -f /etc/lsb-release ]; then
        . /etc/lsb-release
        DISTRO=$DISTRIB_ID
    elif [ -f /etc/redhat-release ]; then
        DISTRO=$(cat /etc/redhat-release | cut -d ' ' -f 1)
    else
        DISTRO="Unknown"
    fi
    echo -e "\n${PURPLE}Linux Distribution: $DISTRO${NC}"
}

# Function to check Go and Docker installations
check_installations() {
    if ! command -v docker >/dev/null 2>&1; then
        echo -e "${RED}Docker is not installed.${NC}"
        echo "Please install Docker from https://docs.docker.com/get-docker/"
        INSTALL_DOCKER=true
    else
        echo -e "${GREEN}Docker is installed.${NC}"
    fi

    if ! pkg-config --exists webkit2gtk-4.0; then
        echo -e "${RED}webkit2gtk is not installed.${NC}"
        INSTALL_WEBKIT=true
    else
        echo -e "${GREEN}webkit2gtk is installed.${NC}"
    fi

    if ! command -v go >/dev/null 2>&1; then
        echo -e "${RED}Go is not installed.${NC}"
        echo "Please install Go from https://golang.org/dl/"
        INSTALL_GO=true
    else
        echo -e "${GREEN}Go is installed.${NC}"
    fi

    if [ "$INSTALL_DOCKER" = true ] || [ "$INSTALL_GO" = true ] || [ "$INSTALL_WEBKIT" = true ]; then
        echo -e "\n${YELLOW}Please install the missing dependencies and run the script again.${NC}"
        exit 1
    fi
}

# Function to clone repository and set it up
setup_repository() {
    echo -e "\n${CYAN}Cloning repository...${NC}"
    REPO_DIR="$HOME/.devbox"
    git clone https://github.com/harshau007/devbox.git "$REPO_DIR" || {
        echo -e "${RED}Failed to clone repository.${NC}"
        exit 1
    }
    cd "$REPO_DIR" || exit 1

    echo -e "\n${CYAN}Setting up the project...${NC}"
    go mod tidy || {
        echo -e "${RED}Failed to set up the project.${NC}"
        remove_repo
        exit 1
    }

    echo -e "\n${BLUE}Building the project...${NC}"
    go build -o devctl || {
        echo -e "${RED}Failed to build the project.${NC}"
        remove_repo
        exit 1
    }

    echo -e "\n${BLUE}Copying binaries and files...${NC}"
    sudo cp devctl portdevctl startdevctl /usr/bin/ || {
        echo -e "${RED}Failed to copy binaries.${NC}"
        remove_repo
        exit 1
    }
    sudo mkdir -p /usr/local/share/devbox/ || {
        echo -e "${RED}Failed to create directory for config files.${NC}"
        remove_repo
        exit 1
    }
    sudo cp dockerfile settings.json setup.sh /usr/local/share/devbox/ || {
        echo -e "${RED}Failed to copy config files.${NC}"
        remove_repo
        exit 1
    }

    echo -e "\n${GREEN}Project setup completed!${NC}"
    echo -e "${YELLOW}Run 'devctl -h' for further details.${NC}"
}

# Function to clone devbox-desktop repository, move files, and clean up
setup_devbox_desktop() {
    echo -e "\n${CYAN}Cloning devbox-desktop repository...${NC}"
    DEVBOX_DESKTOP_DIR="$HOME/.devbox-desktop"
    git clone https://github.com/harshau007/devbox-desktop.git "$DEVBOX_DESKTOP_DIR" || {
        echo -e "${RED}Failed to clone devbox-desktop repository.${NC}"
        exit 1
    }
    cd "$DEVBOX_DESKTOP_DIR" || exit 1

    echo -e "\n${BLUE}Moving devboxdesktop binary...${NC}"
    sudo cp build/bin/devboxdesktop /usr/bin/ || {
        echo -e "${RED}Failed to move devboxdesktop binary.${NC}"
        remove_repo "$REPO_DIR"
        remove_repo "$DEVBOX_DESKTOP_DIR"
        exit 1
    }

    echo -e "\n${BLUE}Moving devbox.desktop...${NC}"
    sudo cp LinuxBuild/devbox.desktop /usr/share/applications/ || {
        echo -e "${RED}Failed to move devbox.desktop.${NC}"
        remove_repo "$REPO_DIR"
        remove_repo "$DEVBOX_DESKTOP_DIR"
        exit 1
    }

    echo -e "\n${BLUE}Moving devbox.png...${NC}"
    sudo cp LinuxBuild/devbox.png /usr/share/pixmaps/ || {
        echo -e "${RED}Failed to move devbox.png.${NC}"
        remove_repo "$REPO_DIR"
        remove_repo "$DEVBOX_DESKTOP_DIR"
        exit 1
    }

    echo -e "\n${GREEN}Setup completed for devbox-desktop!${NC}"
    remove_repo "$DEVBOX_DESKTOP_DIR"
}

# Function to remove the cloned repository
remove_repo() {
    rm -rf "$1"
}

# Function to handle script exit
trap 'remove_repo "$REPO_DIR"; remove_repo "$DEVBOX_DESKTOP_DIR"' EXIT

check_distro
check_installations
setup_repository
setup_devbox_desktop
