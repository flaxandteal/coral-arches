#!/bin/bash
echo ''
echo "*********************************"
echo "*********************************"
echo "*****Building arches project*****"
echo "*********************************"
echo "*********************************"
echo ''
cd ../arches
docker build . -t flaxandteal/arches_coral_base
if (( $? != 0 )); then
  echo "*****There was an issue building arches*****";
  exit 1
fi
echo ''
echo "*********************************"
echo "*********************************"
echo "*****Building coral project********"
echo "*********************************"
echo "*********************************"
echo ''

cd ../coral-arches
pwd
docker-compose --env-file docker/env_file.env build
# docker build .
if (( $? != 0 )); then
  echo "*****There was an issue building afs*****";
  exit 1
fi