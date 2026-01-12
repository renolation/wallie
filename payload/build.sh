#!/bin/bash

set -e

# Configuration
REGISTRY="${DOCKER_REGISTRY:-renolation}"
IMAGE_NAME="wallie"
VERSION="${1:-latest}"
IMAGE_TAG="${REGISTRY}/${IMAGE_NAME}:${VERSION}"

echo "Building Docker image: ${IMAGE_TAG}"

# Build the image
docker build \
  --platform linux/amd64 \
  -t "${IMAGE_TAG}" \
  .

echo "Build complete: ${IMAGE_TAG}"

# Optionally push to registry
if [ "$2" = "--push" ]; then
  echo "Pushing to registry..."
  docker push "${IMAGE_TAG}"
  echo "Push complete"
fi
