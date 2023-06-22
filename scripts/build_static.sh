#!/bin/bash

# Before starting this script please run `reset_db.sh` becuase it must
# be populated to allow the build to complete successfully.

# A full log of this script will be output to the file described below.
LOG_FILE="build_static.log"
exec &> >(tee "$LOG_FILE")

# Start the docker environment required to build arches-coral-static
# This starts in detached mode `-d` which starts the containers in the background
docker-compose -f docker-compose-static-build.yml --env-file docker/env-file.env up --build -d

# Docker build command that directly matches what is defined in the github workflow.
# The network option must be set to `--network host` this allows the build to access
# services on your host machines. In this case it will be accessing the docker environment
# we created using the command above.
docker build \
  --no-cache \
  --build-arg VERSION=latest \
  --build-arg ARCHES_ENVIRONMENT=development \
  --build-arg ARCHES_BASE=flaxandteal/arches_coral_base \
  --build-arg ARCHES_PROJECT=coral \
  --build-arg ARCHES_NAMESPACE_FOR_DATA_EXPORT=http://localhost:8000/ \
  --build-arg DJANGO_DUMMY_SECRET_KEY='c7ky-mc6vdnv+avp0r@(a)8y^51ex=25nogq@+q5*mxwdi' \
  --file Dockerfile.static \
  --tag arches_coral_static:latest \
  --network host \
  .

# Once everything is complete stop the docker environment we created to
# be able to build the above image.
docker-compose -f docker-compose-static-build.yml --env-file docker/env-file.env down