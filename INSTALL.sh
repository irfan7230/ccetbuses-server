#!/bin/bash

# Sundhara Travels - Complete Installation Script
# This script installs all dependencies for both frontend and backend

echo "🚌 Sundhara Travels - Installation Script"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js 18+ first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Node.js found: $(node -v)${NC}"
echo ""

# Frontend Installation
echo -e "${BLUE}📱 Installing Frontend Dependencies...${NC}"
npm install

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Frontend dependencies installed successfully${NC}"
else
    echo -e "${RED}❌ Frontend installation failed${NC}"
    exit 1
fi

echo ""

# Backend Installation
echo -e "${BLUE}🖥️  Installing Backend Dependencies...${NC}"
cd server
npm install

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Backend dependencies installed successfully${NC}"
else
    echo -e "${RED}❌ Backend installation failed${NC}"
    exit 1
fi

cd ..
echo ""

# Check for environment files
echo -e "${BLUE}🔧 Checking Environment Configuration...${NC}"

if [ ! -f ".env" ]; then
    echo -e "${RED}⚠️  .env file not found${NC}"
    echo "Creating from .env.example..."
    cp .env.example .env
    echo -e "${GREEN}✅ Created .env - Please configure with your credentials${NC}"
else
    echo -e "${GREEN}✅ .env file exists${NC}"
fi

if [ ! -f "server/.env" ]; then
    echo -e "${RED}⚠️  server/.env file not found${NC}"
    echo "Creating from server/.env.example..."
    cp server/.env.example server/.env
    echo -e "${GREEN}✅ Created server/.env - Please configure with your credentials${NC}"
else
    echo -e "${GREEN}✅ server/.env file exists${NC}"
fi

echo ""
echo -e "${GREEN}=========================================="
echo "✨ Installation Complete!"
echo "==========================================${NC}"
echo ""
echo "📋 Next Steps:"
echo ""
echo "1. Configure environment variables:"
echo "   - Edit .env (Frontend Firebase config)"
echo "   - Edit server/.env (Backend credentials)"
echo ""
echo "2. Start the backend server:"
echo "   cd server"
echo "   npm run dev"
echo ""
echo "3. In a new terminal, start the frontend:"
echo "   npm start"
echo ""
echo "4. Scan QR code with Expo Go app"
echo ""
echo -e "${BLUE}📖 For detailed setup instructions, see SETUP.md${NC}"
echo ""
