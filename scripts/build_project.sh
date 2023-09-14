#!/bin/bash

LOG_FILE="build_project.log"
exec &> >(tee "$LOG_FILE")

echo ''
echo "*********************************"
echo "*********************************"
echo "*****Building afs project********"
echo "*********************************"
echo "*********************************"
echo ''

cd ../coral-arches
docker-compose --env-file docker/env_file.env build
if (( $? != 0 )); then
  echo "*****There was an issue building afs*****";
  exit 1
fi