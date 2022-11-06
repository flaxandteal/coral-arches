#!/bin/bash

docker rm -f ${ARCHES_FOLDER:-coral}_db_1
ARCHES_ROOT=../arches ARCHES_BASE=arches_coral_base ARCHES_PROJECT=coral docker-compose --env-file docker/env_file.env rm -f db
docker volume rm ${ARCHES_FOLDER:-coral}_postgres-data
ARCHES_ROOT=../arches ARCHES_BASE=arches_coral_base ARCHES_PROJECT=coral docker-compose --env-file docker/env_file.env run --entrypoint /bin/bash arches -c "../entrypoint.sh setup_arches"
ARCHES_ROOT=../arches ARCHES_BASE=arches_coral_base ARCHES_PROJECT=coral docker-compose --env-file docker/env_file.env run --entrypoint /bin/sh arches -c "
. ../ENV/bin/activate; python manage.py createcachetable;
python manage.py packages -o load_package -s coral/pkg/ -y;
python manage.py es index_database
";
ARCHES_ROOT=../arches ARCHES_BASE=arches_coral_base ARCHES_PROJECT=coral docker-compose --env-file docker/env_file.env stop elasticsearch
