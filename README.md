# DevBox Desktop

## About

DevBox Desktop is a multi-screen desktop application developed using the Wails framework with ReactJS for the frontend, TailwindCSS for styling, and Go for the backend. It provides a user-friendly interface for creating and managing isolated containers with desired technology stacks.

## Installation

You can install DevBox Desktop by following these steps:

### Linux and MacOS

Run the following command in your terminal:

```sh
curl -fsSL https://raw.githubusercontent.com/harshau007/devbox-desktop/main/install.sh | sh
```

This will download and install the application on your system.

## Uninstallation

You can uninstall DevBox Desktop by following these step:

### Linux and MacOS

```sh
sudo rm -rf /usr/bin/devctl /usr/bin/portdevctl /usr/bin/startdevctl /usr/local/share/devbox/ /usr/bin/devcontroldesktop /usr/share/pixmaps/devcontroldesktop.png /usr/share/applications/devbox.desktop
```

## Development

To run the application in live development mode:

```sh
wails dev
```

## Building

To build a redistributable, production-ready package, use the following command:

```sh
wails build
```

This will generate a distributable package for your platform in the `build` directory.

## Contributing

We welcome contributions to DevBox Desktop! To contribute, please follow these steps:

1. Fork the repository and clone it to your local machine.
2. Create a new branch for your feature or fix.
3. Make your changes and test them thoroughly.
4. Commit your changes and push them to your fork.
5. Submit a pull request detailing the changes you've made.

## License

DevBox Desktop is released under the [GNU General Public License](LICENSE).
