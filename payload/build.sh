#!/bin/bash

set -e

# Configuration
IMAGE_NAME="wallie"
VERSION="${1:-latest}"
REGISTRY="${DOCKER_REGISTRY:-}"

# Build full image tag
if [ -n "$REGISTRY" ]; then
  IMAGE_TAG="${REGISTRY}/${IMAGE_NAME}:${VERSION}"
else
  IMAGE_TAG="${IMAGE_NAME}:${VERSION}"
fi

echo "Building Docker image: ${IMAGE_TAG}"

# Build the image
docker build \
  --platform linux/amd64 \
  -t "${IMAGE_TAG}" \
  .

echo "Build complete: ${IMAGE_TAG}"

# Optionally push to registry
if [ "$2" = "--push" ] && [ -n "$REGISTRY" ]; then
  echo "Pushing to registry..."
  docker push "${IMAGE_TAG}"
  echo "Push complete"
fi
