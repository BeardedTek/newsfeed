---
weight: 70
title: "Platform-Specific Guides"
bookCollapseSection: true
---

# Platform-Specific Guides

This section provides detailed information on deploying NewsFeed on specific platforms.

## Windows

### Prerequisites

- Windows 10/11 with WSL2 enabled
- Docker Desktop for Windows
- Git for Windows

### Installation Steps

1. **Install WSL2**:
   - Open PowerShell as Administrator
   - Run: `wsl --install`
   - Restart your computer

2. **Install Docker Desktop**:
   - Download from [Docker Desktop](https://www.docker.com/products/docker-desktop/)
   - During installation, ensure WSL2 integration is enabled

3. **Clone the Repository**:
   ```powershell
   # Using PowerShell
   git clone https://github.com/beardedtek/newsfeed.git
   cd newsfeed
   ```

4. **Configure Environment**:
   - Copy example environment files:
     ```powershell
     copy env\frontend.example env\frontend
     copy env\backend.example env\backend
     ```
   - Edit the files with your preferred text editor

5. **Create Docker Networks**:
   ```powershell
   docker network create newsfeed
   docker network create casdoor
   ```

6. **Start the Services**:
   ```powershell
   docker-compose up -d
   ```

7. **Access NewsFeed**:
   - Open a browser and navigate to `http://localhost:80`

### Windows-Specific Considerations

- **File Permissions**: WSL2 and Windows handle file permissions differently. If you encounter permission issues, check the file ownership and permissions in WSL.
- **Performance**: For better performance, store the project files in the WSL2 filesystem rather than the Windows filesystem.
- **Resource Allocation**: Adjust Docker Desktop resource allocation (memory, CPU) in the settings if needed.

## Proxmox

### Prerequisites

- Proxmox VE 7.0+
- LXC container or VM with Docker support
- At least 2GB RAM and 2 CPU cores

### Installation Steps

1. **Create an LXC Container or VM**:
   - For LXC: Use a Ubuntu 22.04 template with nesting enabled
   - For VM: Install Ubuntu 22.04 Server

2. **Install Docker and Docker Compose**:
   ```bash
   # Update system
   apt update && apt upgrade -y
   
   # Install dependencies
   apt install -y apt-transport-https ca-certificates curl software-properties-common
   
   # Add Docker repository
   curl -fsSL https://download.docker.com/linux/ubuntu/gpg | apt-key add -
   add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"
   
   # Install Docker
   apt update
   apt install -y docker-ce docker-compose
   ```

3. **Clone the Repository**:
   ```bash
   git clone https://github.com/beardedtek/newsfeed.git
   cd newsfeed
   ```

4. **Configure Environment**:
   ```bash
   cp env/frontend.example env/frontend
   cp env/backend.example env/backend
   
   # Edit the files
   nano env/frontend
   nano env/backend
   ```

5. **Create Docker Networks**:
   ```bash
   docker network create newsfeed
   docker network create casdoor
   ```

6. **Start the Services**:
   ```bash
   docker-compose up -d
   ```

### Proxmox-Specific Considerations

- **Resource Allocation**: Adjust CPU and memory resources in Proxmox as needed.
- **Storage**: Consider using a dedicated storage volume for the database and thumbnails.
- **Networking**: Configure appropriate network settings in Proxmox for external access.

## Unraid

### Prerequisites

- Unraid 6.9+
- Docker support enabled
- Community Applications (CA) installed

### Installation Steps

1. **Install Docker**:
   - Ensure Docker is enabled in Unraid settings

2. **Create App Folder**:
   - Create a folder for NewsFeed in your appdata share:
     ```bash
     mkdir -p /mnt/user/appdata/newsfeed
     ```

3. **Clone the Repository**:
   ```bash
   cd /mnt/user/appdata/newsfeed
   git clone https://github.com/beardedtek/newsfeed.git .
   ```

4. **Configure Environment**:
   ```bash
   cp env/frontend.example env/frontend
   cp env/backend.example env/backend
   
   # Edit the files
   nano env/frontend
   nano env/backend
   ```

5. **Create Docker Networks**:
   ```bash
   docker network create newsfeed
   docker network create casdoor
   ```

6. **Start the Services**:
   ```bash
   docker-compose up -d
   ```

7. **Add to Unraid Startup**:
   - Create a user script in Unraid to start NewsFeed on system boot

### Unraid-Specific Considerations

- **Persistence**: Store data on the array, not on the cache drive, for better data protection.
- **Backup**: Use Unraid's built-in backup solutions for the NewsFeed data.
- **Monitoring**: Use Unraid's Docker monitoring features to keep track of container health.

## QNAP

### Prerequisites

- QNAP NAS with Container Station installed
- At least 2GB of RAM available for containers

### Installation Steps

1. **Install Container Station**:
   - Open the App Center
   - Find and install Container Station

2. **Enable SSH**:
   - Open Control Panel > Network & File Services > Telnet/SSH
   - Enable SSH and set a port

3. **SSH into QNAP**:
   ```bash
   ssh admin@qnap-ip-address
   ```

4. **Install Docker Compose**:
   ```bash
   curl -L "https://github.com/docker/compose/releases/download/v2.18.1/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
   chmod +x /usr/local/bin/docker-compose
   ```

5. **Create Project Directory**:
   ```bash
   mkdir -p /share/Container/newsfeed
   cd /share/Container/newsfeed
   ```

6. **Clone the Repository**:
   ```bash
   git clone https://github.com/beardedtek/newsfeed.git .
   ```

7. **Configure Environment**:
   ```bash
   cp env/frontend.example env/frontend
   cp env/backend.example env/backend
   
   # Edit the files
   nano env/frontend
   nano env/backend
   ```

8. **Create Docker Networks**:
   ```bash
   docker network create newsfeed
   docker network create casdoor
   ```

9. **Start the Services**:
   ```bash
   docker-compose up -d
   ```

### QNAP-Specific Considerations

- **Resource Limitations**: QNAP NAS devices may have limited resources. Monitor container performance.
- **Persistence**: Store data on a volume that is included in your backup routine.
- **Network Configuration**: Configure port forwarding in QNAP's network settings if you want to access NewsFeed from outside your network. 