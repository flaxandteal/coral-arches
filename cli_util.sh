alias rbwebpack="rm -f log && docker exec -ti coral-arches_arches_1 /bin/sh -c '. ../ENV/bin/activate; cd coral; DJANGO_MODE=DEV NODE_PATH=./media/node_modules NODE_OPTIONS=--max_old_space_size=8192 node --inspect ./media/node_modules/.bin/webpack --config webpack/webpack.config.dev.js' 2>&1 > log"

alias djmang='docker exec -it coral-arches_arches_1 bash -c "source ../ENV/bin/activate && python manage.py \"\${0:-help}\" \"\$@\""'

alias startdocker='docker-compose --env-file docker/env_file.env up'