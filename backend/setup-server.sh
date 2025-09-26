#!/bin/bash

echo "🚀 Setting up Config Dashboard Server..."

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

# Initialize git repository if it doesn't exist
if [ ! -d ".git" ]; then
    echo "🔧 Initializing git repository..."
    git init
    git add .
    git commit -m "Initial commit: Config Dashboard setup"
    
    echo "🔗 Setting up remote repository..."
    git remote add origin git@github.com:nammayatri-ai/configDashboard.git
    git branch -M main
    
    echo "⚠️  Please push to your repository:"
    echo "   git push -u origin main"
else
    echo "✅ Git repository already exists"
    
    # Check if remote is set up
    if ! git remote get-url origin >/dev/null 2>&1; then
        echo "🔗 Adding remote repository..."
        git remote add origin git@github.com:nammayatri-ai/configDashboard.git
    else
        echo "✅ Remote repository already configured"
    fi
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
