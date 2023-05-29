#!/bin/bash

docker rm -f ${ARCHES_FOLDER:-coral}_db_1
docker-compose --env-file docker/env_file.env rm -f db
docker volume rm ${ARCHES_FOLDER:-coral}_postgres-data
docker-compose --env-file docker/env_file.env run --entrypoint /bin/bash arches -c "../entrypoint.sh setup_arches"
docker-compose --env-file docker/env_file.env run --entrypoint /bin/sh arches -c "
. ../ENV/bin/activate; python manage.py createcachetable;
echo 'n\n' | python manage.py packages -o load_package -s coral/pkg/;
python manage.py es index_database
";
#docker-compose --env-file docker/env_file.env stop elasticsearch
