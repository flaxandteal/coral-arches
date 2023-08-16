alias rbwebpack="rm -f log && docker exec -ti coral-arches_arches_1 /bin/sh -c '. ../ENV/bin/activate; cd coral; DJANGO_MODE=DEV NODE_PATH=./media/node_modules NODE_OPTIONS=--max_old_space_size=8192 node --inspect ./media/node_modules/.bin/webpack --config webpack/webpack.config.dev.js' 2>&1 > log"

alias djmang='docker exec -it coral-arches_arches_1 bash -c "source ../ENV/bin/activate && python manage.py \"\${0:-help}\" \"\$@\""'

alias coralup='docker-compose --env-file docker/env_file.env up'

alias archesbash='docker exec -it coral-arches_arches_1 bash'

# This command must be ran from the two repositorys, both folders should be visible
archescopy_fn() {
  docker cp ./$1 coral-arches_arches_1:/web_root/$1
}
alias archescopy=archescopy_fn

# docker cp ./arches/arches/app/media/js/viewmodels/workflow-step.js coral-arches_arches_1:/web_root/arches/arches/app/media/js/viewmodels/workflow-step.js