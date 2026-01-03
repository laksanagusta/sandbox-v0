# Makefile for Docker operations
# Usage: make build   make push   make deploy

# Variables
IMAGE_NAME ?= reika-fe
DOCKER_HUB_USERNAME ?= laksanadika
TAG ?= latest
FULL_IMAGE_NAME = $(DOCKER_HUB_USERNAME)/$(IMAGE_NAME):$(TAG)

# Default target
.PHONY: help
help: ## Show this help message
	@echo "Available commands:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}'

# Build Docker image
.PHONY: build
build: ## Build Docker image
	@echo "Building Docker image: $(FULL_IMAGE_NAME)"
	docker build --no-cache --platform linux/amd64 -t $(FULL_IMAGE_NAME) .
	docker tag $(FULL_IMAGE_NAME) $(DOCKER_HUB_USERNAME)/$(IMAGE_NAME):latest

# Build with specific tag
.PHONY: build-tag
build-tag: ## Build Docker image with specific tag (use TAG=version)
	@echo "Building Docker image: $(DOCKER_HUB_USERNAME)/$(IMAGE_NAME):$(TAG)"
	docker build --no-cache --platform linux/amd64 -t $(DOCKER_HUB_USERNAME)/$(IMAGE_NAME):$(TAG) .

# Login to Docker Hub
.PHONY: login
login: ## Login to Docker Hub
	@echo "Logging in to Docker Hub as $(DOCKER_HUB_USERNAME)"
	docker login

# Push to Docker Hub
.PHONY: push
push: login ## Push Docker image to Docker Hub
	@echo "Pushing image: $(FULL_IMAGE_NAME)"
	docker push $(FULL_IMAGE_NAME)
	@if [ "$(TAG)" != "latest" ]; then \
		echo "Tagging as latest and pushing..."; \
		docker tag $(FULL_IMAGE_NAME) $(DOCKER_HUB_USERNAME)/$(IMAGE_NAME):latest; \
		docker push $(DOCKER_HUB_USERNAME)/$(IMAGE_NAME):latest; \
	fi

# Push specific tag only
.PHONY: push-tag
push-tag: ## Push specific tag only (use TAG=version)
	@echo "Pushing image: $(DOCKER_HUB_USERNAME)/$(IMAGE_NAME):$(TAG)"
	docker push $(DOCKER_HUB_USERNAME)/$(IMAGE_NAME):$(TAG)

# Build and push in one command
.PHONY: build-push
build-push: build push ## Build and push Docker image
	@echo "🎉 Release complete!"

# Build and push with specific tag
.PHONY: build-push-tag
build-push-tag: build-tag push-tag ## Build and push Docker image with specific tag

# Run locally
.PHONY: run
run: ## Run Docker container locally
	@echo "Running container: $(FULL_IMAGE_NAME)"
	docker run -p 3000:3000 --name $(IMAGE_NAME)-container -d $(FULL_IMAGE_NAME)

# Run in interactive mode
.PHONY: run-i
run-i: ## Run Docker container in interactive mode
	@echo "Running container interactively: $(FULL_IMAGE_NAME)"
	docker run -it -p 3000:3000 --rm $(FULL_IMAGE_NAME)

# Stop container
.PHONY: stop
stop: ## Stop running container
	@echo "Stopping container: $(IMAGE_NAME)-container"
	docker stop $(IMAGE_NAME)-container || true
	docker rm $(IMAGE_NAME)-container || true

# View logs
.PHONY: logs
logs: ## View container logs
	docker logs -f $(IMAGE_NAME)-container

# Clean up Docker images
.PHONY: clean
clean: ## Remove Docker images and containers
	@echo "Cleaning up Docker resources..."
	docker stop $(IMAGE_NAME)-container 2>/dev/null || true
	docker rm $(IMAGE_NAME)-container 2>/dev/null || true
	docker rmi $(FULL_IMAGE_NAME) 2>/dev/null || true
	docker rmi $(DOCKER_HUB_USERNAME)/$(IMAGE_NAME):latest 2>/dev/null || true

# Show image info
.PHONY: info
info: ## Show Docker image information
	@echo "Image Name: $(IMAGE_NAME)"
	@echo "Docker Hub Username: $(DOCKER_HUB_USERNAME)"
	@echo "Tag: $(TAG)"
	@echo "Full Image Name: $(FULL_IMAGE_NAME)"
	@echo ""
	@echo "Local Docker images:"
	docker images | grep $(IMAGE_NAME) || echo "No local images found"

# Set up environment variables
.PHONY: setup
setup: ## Setup environment variables (edit this section)
	@echo "Please set your Docker Hub username:"
	@echo "export DOCKER_HUB_USERNAME=your-username"
	@echo ""
	@echo "Or run commands with:"
	@echo "make build DOCKER_HUB_USERNAME=your-username"

# Version bump helpers
.PHONY: version-patch
version-patch: ## Bump patch version (0.0.X)
	@echo "Use: make build-push TAG=v$$(npm version patch --no-git-tag-version)"

.PHONY: version-minor
version-minor: ## Bump minor version (0.X.0)
	@echo "Use: make build-push TAG=v$$(npm version minor --no-git-tag-version)"

.PHONY: version-major
version-major: ## Bump major version (X.0.0)
	@echo "Use: make build-push TAG=v$$(npm version major --no-git-tag-version)"