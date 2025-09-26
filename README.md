# Config Dashboard Server Setup

This document explains how to set up the backend server for the Config Dashboard that handles file management and git integration.

## Features

- ✅ **File Management**: Create, read, update, and delete JSON configuration files
- ✅ **Duplicate Prevention**: Checks if files exist before creating new ones
- ✅ **Git Integration**: Automatically commits and pushes changes to git repository
- ✅ **JSON Validation**: Validates JSON syntax before saving
- ✅ **RESTful API**: Clean API endpoints for all file operations

## Quick Setup

### 1. Run the Setup Script

```bash
./setup-server.sh
```

This script will:
- Install required dependencies (express, cors, nodemon)
- Create the configs directory
- Initialize git repository (if needed)
- Set up .gitignore file

### 2. Configure Git Repository

If this is a new repository, set up your remote:

```bash
git remote add origin <your-repo-url>
git branch -M main
git push -u origin main
```

### 3. Start the Server

**Development mode (with auto-restart):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

The server will run on `http://localhost:3001`

## API Endpoints

### File Operations

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/files/list` | Get list of all JSON files |
| GET | `/api/files/exists/:filename` | Check if file exists |
| GET | `/api/files/content/:filename` | Get file content |
| POST | `/api/files/save` | Save new file |
| PUT | `/api/files/update` | Update existing file |
| DELETE | `/api/files/delete/:filename` | Delete file |

### Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Server health status |

## File Structure

```
configDashboard/
├── configs/                 # JSON configuration files
├── server.js               # Main server file
├── server-package.json     # Server dependencies
├── setup-server.sh         # Setup script
└── SERVER_SETUP.md         # This file
```

## How It Works

### 1. File Creation Flow

1. User enters filename and clicks "Create File"
2. Frontend calls `/api/files/exists/:filename` to check for duplicates
3. If file doesn't exist, creates new file with basic JSON structure
4. User edits the content
5. User clicks "Save File"
6. Backend validates JSON syntax
7. File is saved to `./configs/` directory
8. Git operations: `git add`, `git commit`, `git push`

### 2. File Update Flow

1. User modifies existing file content
2. User clicks "Save File"
3. Backend validates JSON syntax
4. File is updated in `./configs/` directory
5. Git operations: `git add`, `git commit`, `git push`

### 3. Duplicate Prevention

- Before creating new files, the system checks if a file with the same name exists
- If duplicate found, shows error message: "File 'filename.json' already exists"
- User must choose a different name to proceed

## Error Handling

The server handles various error scenarios:

- **File Exists**: Returns 409 status with appropriate message
- **Invalid JSON**: Returns 400 status with validation error
- **File Not Found**: Returns 404 status
- **Git Errors**: Continues with file operations but reports git failures
- **Network Errors**: Returns 500 status with error details

## Environment Variables

You can configure the server using environment variables:

```bash
PORT=3001                    # Server port (default: 3001)
NODE_ENV=development         # Environment mode
```

## Troubleshooting

### Common Issues

1. **Git Push Fails**
   - Ensure git remote is configured
   - Check git credentials
   - Verify repository permissions

2. **Port Already in Use**
   - Change PORT environment variable
   - Kill existing process on port 3001

3. **Permission Denied**
   - Ensure configs directory is writable
   - Check git repository permissions

### Debug Mode

Run with debug logging:

```bash
DEBUG=* npm run dev
```

## Security Considerations

- The server runs on localhost by default
- File operations are restricted to the configs directory
- JSON validation prevents malicious content injection
- Git operations use system git configuration

## Production Deployment

For production deployment:

1. Set up proper authentication
2. Configure HTTPS
3. Use environment variables for sensitive data
4. Set up proper logging
5. Configure reverse proxy (nginx/apache)
6. Set up monitoring and health checks

## Contributing

To contribute to the server:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.
