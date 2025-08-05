#!/bin/bash

# Build Script for Egyptian Price Comparison App
# Waffar Shokran - Build and deployment automation

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="waffar-shokran"
DOCKER_REGISTRY="your-registry.com"  # Change this to your registry
VERSION=${1:-"latest"}
ENVIRONMENT=${2:-"production"}

echo -e "${BLUE}🚀 Building Waffar Shokran - Egyptian Price Comparison App${NC}"
echo -e "${BLUE}Version: ${VERSION}${NC}"
echo -e "${BLUE}Environment: ${ENVIRONMENT}${NC}"
echo -e "${BLUE}Time: $(date '+%Y-%m-%d %H:%M:%S') (Cairo Time)${NC}"
echo ""

# Function to print step headers
print_step() {
    echo -e "\n${GREEN}==> $1${NC}"
}

# Function to handle errors
handle_error() {
    echo -e "\n${RED}❌ Error: $1${NC}"
    exit 1
}

print_step "1. Pre-build validation"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    handle_error "Docker is not running. Please start Docker first."
fi

# Check if required files exist
required_files=(
    "docker-compose.yml"
    "backend/Dockerfile"
    "frontend/Dockerfile"
    "backend/requirements.txt"
    "frontend/package.json"
)

for file in "${required_files[@]}"; do
    if [[ ! -f "$file" ]]; then
        handle_error "Required file $file not found"
    fi
done

print_step "2. Environment setup"

# Load environment variables
if [[ -f ".env.${ENVIRONMENT}" ]]; then
    echo "Loading environment from .env.${ENVIRONMENT}"
    export $(cat .env.${ENVIRONMENT} | grep -v '^#' | xargs)
elif [[ -f ".env" ]]; then
    echo "Loading environment from .env"
    export $(cat .env | grep -v '^#' | xargs)
else
    echo -e "${YELLOW}⚠️  No environment file found. Using defaults.${NC}"
fi

# Set Egyptian timezone
export TZ=Africa/Cairo

print_step "3. Building Backend (FastAPI)"

echo "Building backend Docker image..."
docker build \
    --build-arg VERSION=${VERSION} \
    --build-arg BUILD_DATE=$(date -u +'%Y-%m-%dT%H:%M:%SZ') \
    --target production \
    -t ${PROJECT_NAME}-backend:${VERSION} \
    -t ${PROJECT_NAME}-backend:latest \
    ./backend

if [[ $? -eq 0 ]]; then
    echo -e "${GREEN}✅ Backend build completed successfully${NC}"
else
    handle_error "Backend build failed"
fi

print_step "4. Building Frontend (React + Nginx)"

echo "Building frontend Docker image..."
docker build \
    --build-arg VERSION=${VERSION} \
    --build-arg BUILD_DATE=$(date -u +'%Y-%m-%dT%H:%M:%SZ') \
    --build-arg VITE_API_URL=${VITE_API_URL:-"http://localhost:8000"} \
    --target production \
    -t ${PROJECT_NAME}-frontend:${VERSION} \
    -t ${PROJECT_NAME}-frontend:latest \
    ./frontend

if [[ $? -eq 0 ]]; then
    echo -e "${GREEN}✅ Frontend build completed successfully${NC}"
else
    handle_error "Frontend build failed"
fi

print_step "5. Testing built images"

echo "Testing backend health..."
docker run --rm -d --name test-backend -p 8001:8000 ${PROJECT_NAME}-backend:${VERSION}
sleep 10

if curl -f http://localhost:8001/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend health check passed${NC}"
    docker stop test-backend
else
    docker stop test-backend
    handle_error "Backend health check failed"
fi

echo "Testing frontend..."
docker run --rm -d --name test-frontend -p 8002:80 ${PROJECT_NAME}-frontend:${VERSION}
sleep 5

if curl -f http://localhost:8002/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Frontend health check passed${NC}"
    docker stop test-frontend
else
    docker stop test-frontend
    handle_error "Frontend health check failed"
fi

print_step "6. Image optimization and cleanup"

echo "Removing dangling images..."
docker image prune -f

echo "Image sizes:"
docker images | grep ${PROJECT_NAME}

if [[ "${ENVIRONMENT}" == "production" ]]; then
    print_step "7. Tagging for registry"
    
    echo "Tagging images for registry..."
    docker tag ${PROJECT_NAME}-backend:${VERSION} ${DOCKER_REGISTRY}/${PROJECT_NAME}-backend:${VERSION}
    docker tag ${PROJECT_NAME}-frontend:${VERSION} ${DOCKER_REGISTRY}/${PROJECT_NAME}-frontend:${VERSION}
    
    echo "Tagged images:"
    docker images | grep ${DOCKER_REGISTRY}/${PROJECT_NAME}
    
    print_step "8. Security scan (optional)"
    
    if command -v trivy &> /dev/null; then
        echo "Running security scans..."
        trivy image ${PROJECT_NAME}-backend:${VERSION}
        trivy image ${PROJECT_NAME}-frontend:${VERSION}
    else
        echo -e "${YELLOW}⚠️  Trivy not installed. Skipping security scan.${NC}"
    fi
fi

print_step "9. Build summary"

echo -e "${GREEN}🎉 Build completed successfully!${NC}"
echo ""
echo "Built images:"
echo "  • ${PROJECT_NAME}-backend:${VERSION}"
echo "  • ${PROJECT_NAME}-frontend:${VERSION}"
echo ""
echo "Next steps:"
if [[ "${ENVIRONMENT}" == "production" ]]; then
    echo "  • Push images: ./scripts/deploy.sh push ${VERSION}"
    echo "  • Deploy: ./scripts/deploy.sh deploy ${VERSION}"
else
    echo "  • Start development: docker-compose up"
    echo "  • Run tests: ./scripts/test.sh"
fi
echo ""
echo -e "${BLUE}Happy coding! 🇪🇬${NC}"