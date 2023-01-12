SHELL=bash
MAIN=afs
ARCHES_FOLDER=$(shell basename $(CURDIR))
CATEGORYFILE=category-search-schema.json
SCRIPTSDIR=scripts

GREEN  := $(shell tput -Txterm setaf 2)
YELLOW := $(shell tput -Txterm setaf 3)
WHITE  := $(shell tput -Txterm setaf 7)
CYAN   := $(shell tput -Txterm setaf 6)
RESET  := $(shell tput -Txterm sgr0)

.PHONY: build
build: ## This will build both afs and arches project so make sure they are in the same folder.(example topaz/afs, topaz/arches)
	bash ${SCRIPTSDIR}/build_project.sh

.PHONY: run
run: ## Starts the project.
	bash ${SCRIPTSDIR}/start.sh

.PHONY: resetdb
resetdb: ## Resets the projects database.
	ARCHES_FOLDER=${ARCHES_FOLDER} bash ${SCRIPTSDIR}/reset_db.sh

.PHONY: exportmodels 
exportmodels: ## Exports models either locally or on the cluster. Locally you would need to specify a path. 
	bash ${SCRIPTSDIR}/export_models.sh

.PHONY: genpackages 
genpackages: ## Generates yarn packages.
	bash ${SCRIPTSDIR}/generate_packages.sh

.PHONY: uploadpackages 
uploadpackages: ## Uploads a folder of your choosing to an s3 bucket.
	bash ${SCRIPTSDIR}/minio_upload.sh
	
.PHONY: dockerexec 
dockerexec: ## Uploads a folder of your choosing to an s3 bucket.
	bash ${SCRIPTSDIR}/dockerexec.sh

help: ## Show this help.
	@echo ''
	@echo 'Usage:'
	@echo '  ${YELLOW}make${RESET} ${GREEN}<target>${RESET}'
	@echo ''
	@echo 'Targets:'
	@awk 'BEGIN {FS = ":.*?## "} { \
		if (/^[a-zA-Z_-]+:.*?##.*$$/) {printf "    ${YELLOW}%-20s${GREEN}%s${RESET}\n", $$1, $$2} \
		else if (/^## .*$$/) {printf "  ${CYAN}%s${RESET}\n", substr($$1,4)} \
		}' $(MAKEFILE_LIST)
