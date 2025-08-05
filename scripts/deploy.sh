#!/bin/bash

# Deployment Script for Egyptian Price Comparison App
# Waffar Shokran - Production and staging deployment automation

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="waffar-shokran"
DOCKER_REGISTRY="your-registry.com"
DEFAULT_ENV="production"

# Parse command line arguments
ACTION=${1:-"help"}
VERSION=${2:-"latest"}
ENVIRONMENT=${3:-$DEFAULT_ENV}

echo -e "${BLUE}🚢 Waffar Shokran Deployment Script${NC}"
echo -e "${BLUE}Action: ${ACTION}${NC}"
echo -e "${BLUE}Version: ${VERSION}${NC}"
echo -e "${BLUE}Environment: ${ENVIRONMENT}${NC}"
echo -e "${BLUE}Time: $(TZ=Africa/Cairo date '+%Y-%m-%d %H:%M:%S') (Cairo Time)${NC}"
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

# Function to show help
show_help() {
    echo "Usage: $0 <action> [version] [environment]"
    echo ""
    echo "Actions:"
    echo "  build     - Build Docker images"
    echo "  push      - Push images to registry"
    echo "  deploy    - Deploy to target environment"
    echo "  restart   - Restart services"
    echo "  logs      - Show service logs"
    echo "  status    - Check deployment status"
    echo "  rollback  - Rollback to previous version"
    echo "  cleanup   - Clean up old images and containers"
    echo "  help      - Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 build v1.0.0 production"
    echo "  $0 deploy latest staging"
    echo "  $0 logs"
    echo "  $0 status"
    echo ""
    exit 0
}

# Function to check prerequisites
check_prerequisites() {
    print_step "Checking prerequisites"
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        handle_error "Docker is not installed"
    fi
    
    if ! docker info > /dev/null 2>&1; then
        handle_error "Docker is not running"
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        handle_error "Docker Compose is not installed"
    fi
    
    # Check environment file
    if [[ -f ".env.${ENVIRONMENT}" ]]; then
        echo "Loading environment from .env.${ENVIRONMENT}"
        export $(cat .env.${ENVIRONMENT} | grep -v '^#' | xargs)
    elif [[ -f ".env" ]]; then
        echo "Loading environment from .env"
        export $(cat .env | grep -v '^#' | xargs)
    else
        echo -e "${YELLOW}⚠️  No environment file found${NC}"
    fi
    
    echo -e "${GREEN}✅ Prerequisites check passed${NC}"
}

# Function to build images
build_images() {
    print_step "Building Docker images"
    
    # Use the build script
    if [[ -f "scripts/build.sh" ]]; then
        chmod +x scripts/build.sh
        ./scripts/build.sh ${VERSION} ${ENVIRONMENT}
    else
        # Fallback to direct docker build
        docker build -t ${PROJECT_NAME}-backend:${VERSION} --target production ./backend
        docker build -t ${PROJECT_NAME}-frontend:${VERSION} --target production ./frontend
    fi
    
    echo -e "${GREEN}✅ Images built successfully${NC}"
}

# Function to push images to registry
push_images() {
    print_step "Pushing images to registry"
    
    # Tag for registry
    docker tag ${PROJECT_NAME}-backend:${VERSION} ${DOCKER_REGISTRY}/${PROJECT_NAME}-backend:${VERSION}
    docker tag ${PROJECT_NAME}-frontend:${VERSION} ${DOCKER_REGISTRY}/${PROJECT_NAME}-frontend:${VERSION}
    
    # Push images
    echo "Pushing backend image..."
    docker push ${DOCKER_REGISTRY}/${PROJECT_NAME}-backend:${VERSION}
    
    echo "Pushing frontend image..."
    docker push ${DOCKER_REGISTRY}/${PROJECT_NAME}-frontend:${VERSION}
    
    echo -e "${GREEN}✅ Images pushed successfully${NC}"
}

# Function to deploy services
deploy_services() {
    print_step "Deploying services"
    
    # Choose compose file based on environment
    COMPOSE_FILE="docker-compose.yml"
    if [[ "${ENVIRONMENT}" == "production" ]]; then
        COMPOSE_FILE="docker-compose.prod.yml"
    fi
    
    echo "Using compose file: ${COMPOSE_FILE}"
    
    # Pull latest images
    docker-compose -f ${COMPOSE_FILE} pull
    
    # Deploy with zero-downtime strategy
    echo "Starting deployment..."
    docker-compose -f ${COMPOSE_FILE} up -d --remove-orphans
    
    # Wait for services to be healthy
    print_step "Waiting for services to be healthy"
    
    # Check backend health
    echo "Checking backend health..."
    for i in {1..30}; do
        if curl -f http://localhost:8000/health > /dev/null 2>&1; then
            echo -e "${GREEN}✅ Backend is healthy${NC}"
            break
        fi
        echo "Waiting for backend... (${i}/30)"
        sleep 2
    done
    
    # Check frontend health
    echo "Checking frontend health..."
    for i in {1..15}; do
        if curl -f http://localhost/health > /dev/null 2>&1; then
            echo -e "${GREEN}✅ Frontend is healthy${NC}"
            break
        fi
        echo "Waiting for frontend... (${i}/15)"
        sleep 2
    done
    
    echo -e "${GREEN}✅ Deployment completed successfully${NC}"
}

# Function to restart services
restart_services() {
    print_step "Restarting services"
    
    COMPOSE_FILE="docker-compose.yml"
    if [[ "${ENVIRONMENT}" == "production" ]]; then
        COMPOSE_FILE="docker-compose.prod.yml"
    fi
    
    docker-compose -f ${COMPOSE_FILE} restart
    
    echo -e "${GREEN}✅ Services restarted${NC}"
}

# Function to show logs
show_logs() {
    print_step "Showing service logs"
    
    COMPOSE_FILE="docker-compose.yml"
    if [[ "${ENVIRONMENT}" == "production" ]]; then
        COMPOSE_FILE="docker-compose.prod.yml"
    fi
    
    SERVICE=${2:-""}
    
    if [[ -n "${SERVICE}" ]]; then
        docker-compose -f ${COMPOSE_FILE} logs -f ${SERVICE}
    else
        docker-compose -f ${COMPOSE_FILE} logs -f
    fi
}

# Function to check deployment status
check_status() {
    print_step "Checking deployment status"
    
    COMPOSE_FILE="docker-compose.yml"
    if [[ "${ENVIRONMENT}" == "production" ]]; then
        COMPOSE_FILE="docker-compose.prod.yml"
    fi
    
    echo "Service status:"
    docker-compose -f ${COMPOSE_FILE} ps
    
    echo ""
    echo "Health checks:"
    
    # Backend health
    if curl -f http://localhost:8000/health > /dev/null 2>&1; then
        echo -e "Backend: ${GREEN}✅ Healthy${NC}"
    else
        echo -e "Backend: ${RED}❌ Unhealthy${NC}"
    fi
    
    # Frontend health
    if curl -f http://localhost/health > /dev/null 2>&1; then
        echo -e "Frontend: ${GREEN}✅ Healthy${NC}"
    else
        echo -e "Frontend: ${RED}❌ Unhealthy${NC}"
    fi
    
    # Redis health
    if docker exec waffar_redis_prod redis-cli ping > /dev/null 2>&1; then
        echo -e "Redis: ${GREEN}✅ Healthy${NC}"
    elif docker exec waffar_redis redis-cli ping > /dev/null 2>&1; then
        echo -e "Redis: ${GREEN}✅ Healthy${NC}"
    else
        echo -e "Redis: ${RED}❌ Unhealthy${NC}"
    fi
    
    echo ""
    echo "Resource usage:"
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"
}

# Function to rollback deployment
rollback_deployment() {
    print_step "Rolling back deployment"
    
    PREVIOUS_VERSION=${2:-"previous"}
    
    echo "Rolling back to version: ${PREVIOUS_VERSION}"
    
    # This would typically involve:
    # 1. Pulling previous image versions
    # 2. Redeploying with previous version
    # 3. Health checks
    
    echo -e "${YELLOW}⚠️  Rollback functionality needs to be implemented based on your deployment strategy${NC}"
}

# Function to cleanup old resources
cleanup_resources() {
    print_step "Cleaning up old resources"
    
    echo "Removing stopped containers..."
    docker container prune -f
    
    echo "Removing unused images..."
    docker image prune -f
    
    echo "Removing unused volumes..."
    docker volume prune -f
    
    echo "Removing unused networks..."
    docker network prune -f
    
    echo -e "${GREEN}✅ Cleanup completed${NC}"
}

# Main script logic
case ${ACTION} in
    "build")
        check_prerequisites
        build_images
        ;;
    "push")
        check_prerequisites
        push_images
        ;;
    "deploy")
        check_prerequisites
        deploy_services
        ;;
    "restart")
        check_prerequisites
        restart_services
        ;;
    "logs")
        show_logs
        ;;
    "status")
        check_status
        ;;
    "rollback")
        check_prerequisites
        rollback_deployment
        ;;
    "cleanup")
        cleanup_resources
        ;;
    "help"|*)
        show_help
        ;;
esac

echo ""
echo -e "${BLUE}🇪🇬 Deployment script completed! وفر شكراً${NC}"