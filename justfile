# set TOOLKIT_REPO := "https://github.com/flaxandteal/arches-container-toolkit"
TOOLKIT_FOLDER := "docker"
# set TOOLKIT_RELEASE := main
ARCHES_PROJECT := `ls -1 */__init__.py | head -n 1 | sed 's/\/.*//g'`
ARCHES_BASE := "ghcr.io/flaxandteal/arches-base:coral-7.6"
ARCHES_PROJECT_ROOT := `pwd`
VENV := "../ENV"

[doc('Determines the recipe executed by `just` without one specified')]
default: help

[group('documentation')]
[doc('documentation for justfile usage')]
help:
	@echo
	@echo "ARCHES F&T CONTAINER TOOLS"
	@echo "=========================="
	@echo
	@echo "This Justfile should be present in the top level directory of an Arches project, where manage.py lives. We make some"
	@echo "assumptions based on standard Arches project layout, as set up by 'arches-project create'. Running any other just"
	@echo "command should check whether there is a ./docker/ subfolder, and if not attempt to add the container tools as a submodule"
	@echo "if your project it versioned in git, or download a released copy to ./docker/ if not."
	@echo
	@echo "These are not directly compatible with the container approach in the Arches core tree (although we would like to align"
	@echo "progressively). If you are considering using these, take a look at ./docker/README.md."
	@echo
	@echo \(== ARCHES_PROJECT is [{{ARCHES_PROJECT}}] ==\)
	@echo
	@echo "To set up a new project, ensure the ARCHES_PROJECT above is correct, then run 'make build', followed by 'make run'."
	@echo "If you do not see a project above or it is wrong, ensure that there is exactly one subfolder of this directory with an"
	@echo "__init__.py file."
	@echo
	@echo "Note that '$(ARCHES_PROJECT)/urls.py' must have (manually added):"
	@echo "	if settings.DEBUG:"
	@echo "	    from django.contrib.staticfiles import views"
	@echo "	    from django.urls import re_path"
	@echo "	    urlpatterns += ["
	@echo "		re_path(r'^static/(?P<path>.*)$$', views.serve),"
	@echo "	    ]"
	@echo
	@echo "To run general docker-compose commands, use:"
	@echo "  make docker-compose CMD='...'"
	@echo "or:"
	@echo "  ARCHES_PROJECT_ROOT=$(ARCHES_PROJECT_ROOT) ARCHES_BASE=$(ARCHES_BASE) ARCHES_PROJECT=$(ARCHES_PROJECT) docker-compose -p $(ARCHES_PROJECT) -f docker/docker-compose.yml ..."
	@echo
	@echo "For example:"
	@echo "  make docker-compose CMD='version'"
	@echo
	@just --list

[group('docker')]
[doc('adds context requirement to docker command')]
docker: dl-docker

[group('docker')]
[doc('determines the context for the docker command')]
dl-docker:
	@echo ARCHES_PROJECT is [{{ARCHES_PROJECT}}]
	@echo
	# need toolkit
	@if [ ! -e {{TOOLKIT_FOLDER}}/ ]; then echo "Did not find the Arches F&T Container Toolkit"; exit 1 ; fi
	@if [ -e {{TOOLKIT_FOLDER}}/CONTAINER_TOOLS ]; then echo "It looks like your ./$(TOOLKIT_FOLDER) subfolder does not contain the Arches F&T Container Toolkit\
		you can try changing TOOLKIT_FOLDER in the Makefile to avoid a clash, but this is not a fully-supported use-case."; exit 1 ; fi
	@echo "Arches F&T Container Toolkit now in [{{TOOLKIT_FOLDER}}/]"
	@echo
	# warn if out of date
	@if [ "$$(diff Makefile {{TOOLKIT_FOLDER}}/Makefile)" != "" ]; then echo "Your Makefile in this directory does not match the one in directory [{{TOOLKIT_FOLDER}}], do you need to update it by copying it over this one or vice versa?"; echo; fi

[group('docker')]
[doc('docker compose command, can accept args')]
[positional-arguments]
@compose *args='':
	ARCHES_PROJECT_ROOT={{ARCHES_PROJECT_ROOT}}/ \
	ARCHES_PROJECT={{ARCHES_PROJECT}} \
	ARCHES_BASE={{ARCHES_BASE}} \
	docker compose \
	--profile api \
	-p {{ARCHES_PROJECT}} \
	-f {{TOOLKIT_FOLDER}}/docker-compose.yml \
	"$@"

[group('docker')]
[doc("clears node modules if required packages aren't present to ensure quick build, installs yarn components, bootstraps, loads ontologies and packages if they exist")]
build: check_no_empty_arches_directory check_only_one_python_module docker
	# We need to have certain node modules, so if the additional ones are missing, clean the folder to ensure boostrap does so.
	if [ -z {{ARCHES_PROJECT}}/media/node_modules/jquery-validation ]; then rm -rf {{ARCHES_PROJECT}}/media/node_modules; fi
	just compose stop
	just compose run --rm --entrypoint /web_root/entrypoint.sh arches_worker install_yarn_components
	just compose run --rm --entrypoint /web_root/entrypoint.sh arches_worker bootstrap
	if [ -d {{ARCHES_PROJECT}}/pkg ]; then {{TOOLKIT_FOLDER}}/act.py . load_package --yes; fi
	just compose run --rm --entrypoint /web_root/entrypoint.sh arches_worker run_npm_build_development
	just compose stop
	@echo "IF THIS IS YOUR FIRST TIME RUNNING make build AND YOU HAVE NOT ALREADY, MAKE SURE TO UPDATE urls.py (see just help)"

[group('docker')]
[doc('simply a docker compose build to recreate images from scratch')]
rebuild-images: check_no_empty_arches_directory docker
	just compose build

[group('docker')]
[doc('simply a docker compose down to stop containers')]
down: docker
	just compose down

[group('docker')]
[doc('manage.py from the arches_worker container')]
[positional-arguments]
manage *args: docker
	#!/bin/bash
	if [ $(just group-recipe-exists manage "$1" | wc -w) = 1 ]; 
	then 
	command=$1; shift
	argstring=$(just $command $@); just compose run --rm --entrypoint /bin/bash arches_worker -c ". ../ENV/bin/activate; python manage.py $argstring"
	else argstring=$(echo ". ../ENV/bin/activate; python manage.py $@"); just compose run --rm --entrypoint /bin/bash arches_worker -c "$argstring"
	fi

[group('kube')]
[doc('manage.py from a pods worker container')]
[positional-arguments]
kube namespace *args:
	#!/bin/bash
	echo "namespace: {{namespace}}";
	echo "args: $@"
	shift;
	if [ $(just group-recipe-exists manage "$1" | wc -w) = 1 ]; 
	then 
	command=$1; shift
	argstring=$(just $command $@); kubectl exec -n {{namespace}} $(just get-pod {{namespace}} worker) -- /bin/bash -c ". ../ENV/bin/activate; python manage.py $argstring"
	else argstring=$(echo ". ../ENV/bin/activate; python manage.py $@"); kubectl exec -n {{namespace}} $(just get-pod {{namespace}} worker) -- /bin/bash -c "$argstring"
	fi


@group-recipe-exists group argstring:
	export COMMAND={{argstring}}; echo $COMMAND | awk '{print $1}' | just get-recipes-by-group {{group}} | grep \"{{argstring}}\"

@get-recipes-by-group group:
	just --dump --dump-format json | jq '.recipes[] | select(.attributes[] | select(type == "object") | select(.group == "{{group}}")) | .name'

[group('docker')]
[doc('simply a docker compose run to start containers')]
run: docker
	just compose up

[group('docker')]
[doc('restarts the arches container with --service-ports')]
web: docker
	just compose stop arches
	just compose run --rm --service-ports arches

[group('docker')]
[doc('runs the arches_worker and runs the webpack command in DEV mode')]
webpack: docker
	just compose run --rm --entrypoint /bin/bash arches_worker -c '. ../ENV/bin/activate; cd {{ARCHES_PROJECT}}; DJANGO_MODE=DEV NODE_PATH=./media/node_modules NODE_OPTIONS=--max_old_space_size=8192 node --inspect ./media/node_modules/.bin/webpack --config webpack/webpack.config.dev.js'

[group('docker')]
[doc('docker compose down and remove the volumes and images')]
[confirm('This will remove all database and elasticsearch data, are you sure? [y/N]')]
clean: docker
	just compose down -v --rmi all

[positional-arguments]
@get-graph-ids *args:
	if [ ! $1 = '-q' ]; then for graph in "$@"; do echo $graph $(grep graph_id "coral/pkg/graphs/resource_models/$graph.json" | tail -n 1); done fi
	if [ $1 = '-q' ]; then shift; for graph in "$@"; do grep graph_id "coral/pkg/graphs/resource_models/$graph.json" | tail -n 1 | awk -F'"' '{print $4}'; done; fi

[group('python')]
[doc('python shell command for deleting a model')]
@delete-graph graphid:
	echo "from arches.app.models.graph import Graph; import os; graph = Graph.objects.get(pk=\"{{graphid}}\"); print(graph); graph.delete()"

[group('manage')]
[doc('manage.py command to remove all resources for a model')]
@delete-resources graph:
	echo "resources remove_resources -g $(just get-graph-ids -q {{graph}}) -y"

[group('manage')]
[doc('manage.py command to export business data')]
@export-business-data graph dir:
	echo "packages -o export_business_data -g $(just get-graph-ids -q {{graph}}) -f json -d {{dir}}"

[group('manage')]
[doc('manage.py command to import a graph')]
@import-graph graph:
	echo 'packages -o import_graphs -s "coral/pkg/graphs/resource_models/{{graph}}.json"'


[group('kube')]
[doc('deletes all munal-recalc jobs for selected namespace')]
@delete-all-jobs namespace:
	kubectl -n {{namespace}} get jobs --no-headers | grep "manual-recalc" | awk '{print $1}' | xargs kubectl -n {{namespace}} delete job

[group('kube')]
[doc('begins a recalculate permissions process')]
@trigger-permissions namespace:
	kubectl exec -n {{namespace}} $(just get-pod {{namespace}} api) -- /bin/bash -c ". ../ENV/bin/activate; celery -b \$CELERY_BROKER_URL call coral.tasks.recalculate_permissions_table"

[group('kube')]
[doc('find the pod in a namespace by tier. tier:backend|frontend|api|worker')]
@get-pod namespace tier:
	kubectl get pods --no-headers -n {{namespace}} -l tier='{{tier}}' | awk '{print $1}'

[group('kube')]
[doc('exec into pod tier:backend|frontend|api|worker')]
@exec-pod namespace tier:
	kubectl exec --stdin --tty -n {{namespace}} $(just get-pod {{namespace}} {{tier}}) -- /bin/bash

[group('kube')]
[doc('manually clear celery queue')]
@clear-celery namespace:
	kubectl exec -n {{namespace}} {{namespace}}-rabbitmq-0 -- /bin/bash -c "rabbitmqctl delete_queue celery"


[private]
@check_only_one_python_module:
	if [ $(find . -maxdepth 2 -name __init__.py | wc -l) -gt 1 ]; then echo "You have additional python modules in the {{ARCHES_PROJECT}}/"; echo $(find . -maxdepth 2 -not -wholename './{{ARCHES_PROJECT}}/__init__.py' -name __init__.py); exit 1 ; fi

[private]
@check_no_empty_arches_directory:
	if [ $(find . -empty -type d -name arches) ]; then echo "There is an empty arches directory in your project, this will create an empty module"; exit 1; fi



# for func in $(ls coral/functions/); do if [[ $func != *"__"* ]]; then python manage.py fn register -s coral/functions/$func; fi done

# get business data excluding a specific nodeid
# jq '.business_data.resources[].tiles |= map(select(.nodegroup_id != "ae2039a4-7070-11ee-bb7a-0242ac140008"))' Group_2024-12-09_13-46-27.json 

# Get all group data but members (not as useful as i thought because some members are there to set permissions, i.e when another group is the member), I've included business_data.resource because I was getting confused working with non-symetrical jsons
# .business_data.resources[] | {name: .resourceinstance.name, tiles: [.tiles[] | select(.nodegroup_id == "ae2039a4-7070-11ee-bb7a-0242ac140008")]} | select(.tiles | length > 0)


# get member tiles only from environment
# jq '.business_data.resources | map(
#   {
#     name: .resourceinstance.name,
#     tiles: [.tiles[] | select(.nodegroup_id == "bb2f7e1c-7029-11ee-885f-0242ac140008")]
#   } | select(.tiles | length > 0)) | {business_data: {resources: .}}' > member_only.json


# combine member tiles to the memberless group, adds the member tiles everything else uses the first file
# jq --slurp '
# {
#   "business_data": {
#     "resources": (
#       map(.business_data.resources) | add |
#       group_by(.resourceinstance.name) |
#       map({
#         resourceinstance: .[0].resourceinstance,
#         tiles: (
#           map(.tiles) | add |
#           group_by(.nodegroup_id) |
#           map(if .[0].nodegroup_id == "bb2f7e1c-7029-11ee-885f-0242ac140008" then # only add members
#             {
#               nodegroup_id: .[0].nodegroup_id,
#               parenttile_id: .[0].parenttile_id,
#               provisionaledits: .[0].provisionaledits,
#               resourceinstance_id: .[0].resourceinstance_id,
#               sortorder: .[0].sortorder,
#               tileid: .[0].tileid, # .[0] use the first file for everything but data
#               data: (
#                 reduce .[].data as $item ({}; . + ($item | if type == "object" then $item else {} end))
#               ) # reduce data to one list of all members; TODO exclude duplicates
			  
#             }
#           else
#             .[0] # use the first file for all nodegroups that are not members
#           end)
#         )
#       })
#     )
#   }
# }
# ' memberless_group.json member_only.json > merged.json


# just manage packages -o import_business_data -s merged.json -ow overwrite


