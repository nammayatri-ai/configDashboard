# Config Dashboard - Docker Setup

This project is containerized using Docker and Docker Compose for easy deployment and development.

## Project Structure

```
configDashboard/
├── frontend/           # React/Vite frontend application
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── src/
│   ├── package.json
│   └── vite.config.ts
├── backend/            # Node.js backend server
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── server.js
│   ├── package.json
│   ├── config/
│   └── configs/
├── docker-compose.yml  # Docker Compose configuration
├── .env.example       # Environment variables template
└── README.md
```

## Quick Start

1. **Clone and setup environment:**
   ```bash
   git clone <repository-url>
   cd configDashboard
   cp .env.example .env
   # Edit .env with your configuration
   ```

2. **Build and run with Docker Compose:**
   ```bash
   docker-compose up --build
   ```

3. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8090

## Environment Variables

Copy `.env.example` to `.env` and configure:

- **Git Configuration**: Set your GitHub repository URL, user details, and token
- **Firebase Configuration**: Add your Firebase project credentials
- **API Configuration**: Set the API base URL for frontend-backend communication

## Docker Services

### Frontend (Port 3000)
- **Technology**: React + Vite
- **Build**: Production build with optimized assets
- **Environment**: Development mode with hot reloading

### Backend (Port 8090)
- **Technology**: Node.js + Express
- **Features**: File management, Git operations, API endpoints
- **Dependencies**: Git (for repository operations)

## Development

For development with hot reloading:

```bash
# Frontend development
cd frontend
npm install
npm run dev

# Backend development
cd backend
npm install
node server.js
```

## Production Deployment

```bash
# Build production images
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up --build

# Or build individual services
docker build -t config-dashboard-frontend ./frontend
docker build -t config-dashboard-backend ./backend
```

## Git Operations

The backend service handles Git operations:
- File uploads to GitHub repository
- Automatic commits and pushes
- Repository configuration via environment variables

Make sure to configure your Git credentials in the `.env` file.
