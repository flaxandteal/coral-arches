# Arches Coral Project

## Recipe to get the static build working locally

Firstly I have created a new script that will immediate the same operation that takes place during the `Build-Arches-Static` portion of the github workflow.

This involves setting up the database, elastic search and an arches instance. This can all be seen within `docker-compose-static-build.yml` and if you review `.github/workflows/project.yml` you'll be able to see `Build-Arches-Static` configures the same services.

### Prerequisites

The database is a very important component of this entire project and is `REQUIRED` to build the project in any state.

The step in building the static version locally is building the database. This can be done from the root of the project by running the command:
```bash
bash scripts/reset_db.sh
```

Resetting the database takes about 25 minutes so be prepared to wait for it to complete.

### Building the arches_coral_static image

Moving on from here you should be able to build the static image of the project successfully. To start building the static image run the command:
```bash
bash scripts/build_static.sh
```

This process doesn't take as long as the database build and takes the most time while indexing the database in elastic search. Looking at the logs produced from the elastic container created in the first line of the `build_static.sh` script. You'll be able to see a lot of info logs being produced while the build.

```
Warning: No valid output stream.
```

This process is taking place during the console message shown above and it will appear as though the process is hanging, don't worry it's just processing the index.

### Starting the environment

To start the environment you simply need to run the command:
```bash
docker-compose -f docker-compose-static.yml --env-file docker/env_file.env up
```

This will the `docker-compose-static.yml` to setup all the required services including the static build of the project.

This can then be visited at `http://localhost:8000`.


# docker-compose.yml

## Services

### cantaloupe_afs:

Sets up the service

### arches_frontend:

- Uses an image create from the env_file that is provided to docker-compose. The result will be `arches_coral`.
- Enters the entrypoint.sh file and runs the command `run_yarn_start`. Used to be `run_yarn` which didn't exist.
- Within the `arches_coral` image that's created there is `arches` and `coral`. Which I believe is the front and back end of the application.
- The dockerfile used to build the service is `Dockerfile`.
- Important volumes created:
- - `arches-static:/static_root` this needs to be investigated where does arches-static originate from?
- - `./$ARCHES_PROJECT:/web_root/$ARCHES_PROJECT` this will result in /coral being linked to /web_root/coral.
- - `./entrypoint.sh:/web_root/entrypoint.sh` the entry point script is linked.
- - `./settings_docker.py:/web_root/arches/arches/settings_docker.py` the settings file is linked but to the backend arches and not coral arches.

Environment variables for the service:
```
- ARCHES_PROJECT=$ARCHES_PROJECT
- COMPRESS_OFFLINE=False
- INSTALL_DEFAULT_GRAPHS=False
- INSTALL_DEFAULT_CONCEPTS=False
- PGUSERNAME=postgres
- PGPASSWORD=postgres
- PGDBNAME=arches
- PGHOST=db
- PGPORT=5432
- COUCHDB_HOST=couchdb
- COUCHDB_PORT=5984
- COUCHDB_USER=admin
- COUCHDB_PASS=password
- ESHOST=elasticsearch
- ESPORT=9200
- CELERY_BROKER_URL=amqp://rabbitmq
- DJANGO_MODE=DEV
- DJANGO_DEBUG=True
# - DJANGO_REMOTE_DEBUG=False
- DOMAIN_NAMES=localhost
- PYTHONUNBUFFERED=0
- TZ=PST
```

The frontend should be able to be viewed on the port `8080`. Although currently it just shows `Cannot GET /` no matter what endpoint you visit.

The service depends on:

- arches
- db
- elasticsearch

### arches:

- Uses an image create from the env_file that is provided to docker-compose. The result will be `arches_coral`.
- Enters the entrypoint.sh file and runs the command `run_arches`.
- Within the `arches_coral` image that's created there is `arches` and `coral`. Which I believe is the front and back end of the application.
- The dockerfile used to build the service is `Dockerfile`.
- Important volumes created:
- - `arches-static:/static_root` this needs to be investigated where does arches-static originate from?
- - `./$ARCHES_PROJECT:/web_root/$ARCHES_PROJECT` this will result in /coral being linked to /web_root/coral.
- - `./entrypoint.sh:/web_root/entrypoint.sh` the entry point script is linked.
- - `./settings_docker.py:/web_root/arches/arches/settings_docker.py` the settings file is linked but to the backend arches and not coral arches.

Environment variables for the service:
```
- ARCHES_PROJECT=$ARCHES_PROJECT
- COMPRESS_OFFLINE=False
- INSTALL_DEFAULT_GRAPHS=False
- INSTALL_DEFAULT_CONCEPTS=False
- PGUSERNAME=postgres
- PGPASSWORD=postgres
- PGDBNAME=arches
- PGHOST=db
- PGPORT=5432
- COUCHDB_HOST=couchdb
- COUCHDB_PORT=5984
- COUCHDB_USER=admin
- COUCHDB_PASS=password
- ESHOST=elasticsearch
- ESPORT=9200
- CELERY_BROKER_URL=amqp://rabbitmq
- DJANGO_MODE=DEV
- DJANGO_DEBUG=True
# - DJANGO_REMOTE_DEBUG=False
- DOMAIN_NAMES=localhost
- PYTHONUNBUFFERED=0
- TZ=PST
```

The service depends on:

- couchdb
- db
- elasticsearch

Should be hosted on port `8000`.

> THE ONLY CHANGE BETWEEN THE ARCHES_FRONTEND SERVICE AND THE ARCHES SERVICE IS THE DEPENDENCY OF `couch_db` AND THE ENTRY POINT COMMAND

### arches_worker:

> SAME AS THE LAST TWO BUT DIFFERENT ENTRY POINT `run_celery` AND DEPENDS ON

Depends on:
- db
- elasticsearch
- couchdb
- rabbitmq


### db:

- Builds from postgis image `kartoza/postgis:12.0`
- Important volumes:
- - `${ARCHES_ROOT}/arches/install/init-unix.sql:/docker-entrypoint-initdb.d/init.sql` this is important because looking at the environment file `ARCHES_ROOT` equals `../arches` this indicates that their needs to be an additional arches repository outside of the coral repository to go find the `init-unix.sql` file that will create the database and the template needed.

Hosted on port `5432`.

Environment variables:
```
- POSTGRES_USER=postgres
- POSTGRES_PASS=postgres
- POSTGRES_DB=postgres
- POSTGRES_MULTIPLE_EXTENSIONS=postgis,postgis_topology
- TZ=PST
```

## The Dockerfile

This is referring to `Dockerfile` and not the other files with dot extensions.

Steps:
- `ARG ARCHES_BASE=flaxandteal/arches_coral_base` Configure an argument `ARG ARCHES_BASE=flaxandteal/arches_coral_base`.
- `FROM $ARCHES_BASE` if we recall the environment variables set this as `../arches`.
- `RUN useradd arches` a new user called arches is created.
- `RUN chgrp arches ../entrypoint.sh && chmod g+rx ../entrypoint.sh` the entrypoint file has it's permissions changed and the ownership group set to the arches user. "g+rx" grants the group the ability to read and execute the file or directory.
- `ARG ARCHES_PROJECT` this will get the `coral` value
- `ENV ARCHES_PROJECT $ARCHES_PROJECT` sets the environment variable to `coral`.
- `COPY entrypoint.sh ${WEB_ROOT}/` copy the entrypoint file to `web_root/`
- `COPY ${ARCHES_PROJECT} ${WEB_ROOT}/${ARCHES_PROJECT}/` copy `coral/` to `web_root/coral`
```
RUN . ../ENV/bin/activate \
    && pip install cachetools websockets \
    && pip install -r ${WEB_ROOT}/${ARCHES_PROJECT}/requirements.txt
```
Does the above statement work. Does ../ENV/bin/activate exist in the container or must it be copied over during the docker build?
- `COPY settings_docker.py ${WEB_ROOT}/${ARCHES_PROJECT}/${ARCHES_PROJECT}/` copy the settings file to `web_root/coral/coral/`
- `RUN echo "{}" > ${WEB_ROOT}/${ARCHES_PROJECT}/${ARCHES_PROJECT}/webpack/webpack-stats.json` this will create an empty json file in `web_root/coral/coral/webpack/`
- `WORKDIR ${WEB_ROOT}/${ARCHES_PROJECT}/${ARCHES_PROJECT}` the working directory will be set to `web_root/coral/coral/`
- `RUN mkdir -p /static_root && chown -R arches /static_root` created new directory called `/static_root`. The owner of this directory is changed to the arches user and all files inside are recursively changed to the arches user.
- `RUN yarn install` the package.json is then installed.
- `WORKDIR ${WEB_ROOT}/${ARCHES_PROJECT}` the working directory is changed to `web_root/coral/`
- `ENTRYPOINT ../entrypoint.sh` the entry point is set to the entry point script.
- `CMD run_arches` the default command is configured. The command defined in docker-compose takes precedence over this.
- Using both ENTRYPOINT and CMD in the same file will provide the CMD as parameters to the ENTRYPOINT.
- `USER 1000` the user is then switched to a non-root user.

## Attempting to start the project

Using the branch `graph-api-etl` and running `docker-compose --env-file docker/env_file.env up` from the root of `arches_coral`. The project starts building and eventually completes.

The arches backend seems to have build correctly and functions correctly. The only issues I see is when visiting `localhost:8000` I get a webpack error saying `Error reading /web_root/coral/coral/webpack/webpack-stats.json. Are you sure webpack has generated the file and the path is correct?`

Next I will double check if that file exists in ` /web_root/coral/coral/webpack/` if we refer back to the `Dockerfile` it's clear that the file should have been created `RUN echo "{}" > ${WEB_ROOT}/${ARCHES_PROJECT}/${ARCHES_PROJECT}/webpack/webpack-stats.json`.

**PROBLEM 1**

The file does not exist in that directory

I believe this issue is being caused by my local coral project not having a `webpack-stats.json` file within that directory and when the copy over takes place it is overwriting the one that was created during the build.

To attempt to resolve this I will ignore the file `webpack-stats.json` from the `./$ARCHES_PROJECT:/web_root/$ARCHES_PROJECT` volume that copies the local version with no `webpack-stats.json` file.

REMOVE: I added this to the volumes `/web_root/$ARCHES_PROJECT/$ARCHES_PROJECT/webpack/webpack-stats.json`.

Creating the `webpack-stats.json` file manually stops the error from appearing which is good I was able to login and progress. Navigating to any other page won't work at this point.

**PROBLEM 2**

The frontend install during the Dockerfile is pointless because the `node_modules` are overwritten when the volume copies over the local version that isn't installed at this point.

My attempt to fix this will be to stop the volume copying over the local version and just work from the container version. This should let it install from the build and I can see what ever errors appear from that.

> After I will attempt this on the webpack-stats.json to confirm it is getting created by the build

The `node_modules` will have to be installed locally because it wants you to manually accept the installation of webpack-cli.

So I will goto `./coral/coral` and run `yarn install`. Then once installed I will attempt to bring the docker environment back up.

The request to install `webpack-cli` only takes place when running `yarn run start`. So I bring down the container again and run `yarn run start` locally. This then prompts me with the message to install `webpack-cli` an additional prompt is presented asking to install `webpack-dev-server` both are agreed to.

Once installed an error appears. This error appears because we attempted to do `yarn run start` locally and can be ignored. Running the command again will show the error message without the install prompts which is what we want.

Attempting the bring up the docker environment again.

This seems to have resolved starting the frontend but visiting `localhost:8080` still shows `Cannot GET /`. Looking at the frontend container logs there is a new error.

**PROBLEM 3**

The frontend is showing the error `Module not found: Error Can't resolve '/web_root/coral/coral/media/node_modules/babel-loader' in /web_root/coral/coral`.

First I will check if the package is present within the local `node_modules` which is taking precedence at this point.

`babel-loader` does not exist in `node_modules`.

Next I checked the `package.json` and `package-lock.json`. I found it as a dependency of `arches-dev-dependencies`.

```
"node_modules/arches-dev-dependencies": {
    "version": "7.1.0",
    "resolved": "git+ssh://git@github.com/archesproject/arches-dev-dependencies.git#ab04bc385cfa6963e63769c287b28e26ca081858",
    "dev": true,
    "dependencies": {
        ...
        "babel-loader": "^8.2.3",
        ...
    }
},
```

I then realized that there was 2 `node_modules` folders created. One within `/coral/coral/media` and the other `/coral/coral` this must have happened because of the `webpack-cli` and `webpack-dev-server` install.

The `babel-loader` package exists in the `node_modules` outside of `/media`.

The `package-lock.json` has completely changed with new packages added including the `babel-loader` as it was installed in the outside `node_modules`.

To attempt to update the `node_modules` within the `/media` folder I'm going to run `yarn install` locally again at `/coral/coral`.

Attempting to bring docker up again.

No longer facing the `babel-loader` missing issue.

**PROBLEM 4**

Bonus at this point **PROBLEM 1** is fixed as webpack exists to create the `webpack-stats.json` file.

The frontend starts loading and attempts to find every single `.htm` file that exists and load it. It then fails on every single file saying that it can't load it.

Visiting `localhost:8000` I can see the landing page and proceed to the login page and successfully login. After logging in I cannot navigate to any other pages such as the `Find` page. That is shown on the landing page. Clicking this button displays the errors that are being shown in the frontend containers logs `ERROR in ../../arches/arches/app/templates/views/components/datatypes/number.htm`

It's worth noting that `:8000` should be the backend and `:8080` should be the frontend.

Visiting `localhost:8080` is still showing `Cannot GET /`.









## After meeting with Phil

The frontend build is dependant on the database existing this is due to the resources existing in the database being needed to provide the static HTML with data.

The database must exist to get anywhere with Arches development.

Getting setup with the static build of Arches should be the first step in making progress.

To build the Arches static image you can use the script `build_docker.sh`.

I had to fix a couple things in this script




