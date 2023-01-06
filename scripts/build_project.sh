#!/bin/bash
echo ''
echo "*********************************"
echo "*********************************"
echo "*****Building arches project*****"
echo "*********************************"
echo "*********************************"
echo ''
cd ../arches
pip install -r arches/install/requirements.txt
pip install -r arches/install/requirements_dev.txt
docker build . -t arches
if (( $? != 0 )); then
  echo "*****There was an issue building arches*****";
  exit 1
fi
echo ''
echo "*********************************"
echo "*********************************"
echo "*****Building afs project********"
echo "*********************************"
echo "*********************************"
echo ''

cd ../afs
bash build_docker.sh
if (( $? != 0 )); then
  echo "*****There was an issue building afs*****";
  exit 1
fi