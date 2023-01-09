#!/bin/sh

docker-compose --env-file docker/env-file.env build

# The dummy secret key is simply to allow manage.py to run,
# for the static build. It does not need to, and should not,
# match any live key.
docker build --no-cache --build-arg ARCHES_PROJECT=coral --build-arg DJANGO_DUMMY_SECRET_KEY='c7ky-mc6vdnv+avp0r@(a)8y^51ex=25nogq@+q5*mxwdi' --build-arg VERSION=feature-ci -f Dockerfile.static -t arches_coral_static:latest .
