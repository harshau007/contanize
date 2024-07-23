#!/usr/bin/env sh
# Copyright 2024-present Contanize contributors.

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

    if ! docker buildx version >/dev/null 2>&1; then
        echo -e "${RED}Docker Buildx is not installed or not configured.${NC}"
        echo "Please install Docker Buildx from https://docs.docker.com/buildx/working-with-buildx/"
        INSTALL_BUILDX=true
    else
        echo -e "${GREEN}Docker Buildx is installed.${NC}"
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

    if [ "$INSTALL_DOCKER" = true ] || [ "$INSTALL_BUILDX" = true ] || [ "$INSTALL_GO" = true ] || [ "$INSTALL_WEBKIT" = true ]; then
        echo -e "\n${YELLOW}Please install the missing dependencies and run the script again.${NC}"
        exit 1
    fi
}

# Function to clone contanize repository, move files, and clean up
setup_contanize() {
    echo -e "\n${CYAN}Cloning contanize repository...${NC}"
    CONTANIZE_DIR="$HOME/.contanize"
    git clone https://github.com/harshau007/contanize.git "$CONTANIZE_DIR" || {
        echo -e "${RED}Failed to clone contanize repository.${NC}"
        exit 1
    }
    cd "$CONTANIZE_DIR" || exit 1

    echo -e "\n${BLUE}Moving contanize binary...${NC}"
    sudo cp build/bin/contanize /usr/bin/ || {
        echo -e "${RED}Failed to move contanize binary.${NC}"
        remove_repo "$REPO_DIR"
        remove_repo "$CONTANIZE_DIR"
        exit 1
    }

    echo -e "\n${BLUE}Moving contanize.desktop...${NC}"
    sudo cp LinuxBuild/contanize.desktop /usr/share/applications/ || {
        echo -e "${RED}Failed to move contanize.desktop.${NC}"
        remove_repo "$REPO_DIR"
        remove_repo "$CONTANIZE_DIR"
        exit 1
    }

    echo -e "\n${BLUE}Moving Essentials...${NC}"
    sudo cp LinuxBuild/dockerfile LinuxBuild/settings.json LinuxBuild/setup.sh /usr/local/share/contanize/ || {
        echo -e "${RED}Failed to copy essentials files.${NC}"
        remove_repo
        exit 1
    }

    echo -e "\n${BLUE}Moving contanize.png...${NC}"
    sudo cp LinuxBuild/contanize.png /usr/share/pixmaps/ || {
        echo -e "${RED}Failed to move contanize.png.${NC}"
        remove_repo "$REPO_DIR"
        remove_repo "$CONTANIZE_DIR"
        exit 1
    }

    echo -e "\n${GREEN}Setup completed for contanize!${NC}"
    remove_repo "$CONTANIZE_DIR"
}

# Function to remove the cloned repository
remove_repo() {
    rm -rf "$1"
}

# Function to handle script exit
trap 'remove_repo "$REPO_DIR"; remove_repo "$CONTANIZE_DIR"' EXIT

check_distro
check_installations
setup_contanize
