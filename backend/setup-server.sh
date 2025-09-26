#!/bin/bash

echo "🚀 Setting up Config Dashboard Server..."

# Load environment variables from .env file if it exists
if [ -f ".env" ]; then
    echo "📄 Loading environment variables from .env file..."
    set -a  # automatically export all variables
    source .env
    set +a  # stop automatically exporting
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

# Install server dependencies
echo "📦 Installing server dependencies..."
npm install express cors

# Install dev dependencies
echo "📦 Installing dev dependencies..."
npm install --save-dev nodemon

# Create configs directory if it doesn't exist
echo "📁 Creating configs directory..."
mkdir -p configs

# Initialize git repository in parent directory if it doesn't exist
if [ ! -d "../.git" ]; then
    echo "🔧 Initializing git repository in parent directory..."
    cd ..
    git init
    git add .
    git commit -m "Initial commit: Config Dashboard setup"
    
    echo "🔗 Setting up remote repository..."
    git remote add origin https://github.com/nammayatri-ai/configDashboard.git
    git branch -M main
    
    echo "⚠️  Please push to your repository:"
    echo "   git push -u origin main"
    cd backend
else
    echo "✅ Git repository already exists in parent directory"
    
    # Check if remote is set up (from parent directory)
    cd ..
    if ! git remote get-url origin >/dev/null 2>&1; then
        echo "🔗 Adding remote repository..."
        git remote add origin https://github.com/nammayatri-ai/configDashboard.git
    else
        echo "✅ Remote repository already configured"
        # Update remote URL to HTTPS for token authentication
        git remote set-url origin https://github.com/nammayatri-ai/configDashboard.git
    fi
    
    # Configure Git for token authentication
    echo "🔐 Configuring Git authentication..."
    
    # Configure Git pull strategy
    echo "⚙️  Configuring Git pull strategy..."
    git config pull.rebase false
    
    # Pull latest changes from main branch using token
    echo "📥 Pulling latest changes from main branch..."
    if [ -n "$GIT_TOKEN" ]; then
        echo "🔐 Using Git token for authentication..."
        git fetch origin
        git pull https://$GIT_TOKEN@github.com/nammayatri-ai/configDashboard.git main --allow-unrelated-histories
        echo "✅ Successfully pulled latest changes from main branch"
    else
        echo "❌ GIT_TOKEN environment variable is required for authentication"
        echo "Please set GIT_TOKEN environment variable with your GitHub token"
        exit 1
    fi
    cd backend
fi

# Create .gitignore if it doesn't exist
if [ ! -f ".gitignore" ]; then
    echo "📝 Creating .gitignore..."
    cat > .gitignore << EOF
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Production builds
dist/
build/

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# IDE files
.vscode/
.idea/
*.swp
*.swo

# OS files
.DS_Store
Thumbs.db

# Logs
logs/
*.log
EOF
fi

echo "✅ Server setup complete!"
echo ""
echo "🔧 To start the server:"
echo "   npm start"
echo ""
echo "🔧 To start in development mode:"
echo "   npm run dev"
echo ""
echo "📝 Make sure to:"
echo "   1. Set up your git remote repository"
echo "   2. Configure git user credentials"
echo "   3. Test the API endpoints"
echo ""
echo "🌐 Server will run on: http://localhost:3001"
echo "📁 Files will be saved to: ./configs/"
