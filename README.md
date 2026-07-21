# Welcome to the Coral-Arches Project!

## Arches
Arches is a new, open-source, web-based, geospatial information system for cultural heritage inventory and management. Arches is purpose-built for the international cultural heritage field, and it is designed to record all types of immovable heritage, including archaeological sites, buildings and other historic structures, landscapes, and heritage ensembles or districts.

Please see the [project page](http://archesproject.org/) for more information on the Arches project.

The Arches Installation Guide and Arches User Guide are available [here](http://archesproject.org/documentation/).

## Coral
Coral is a project made for the Historic Environment Division (HED) of the The Historic Environment Record of Northern Ireland (HERoNI). 

The HED records, protects, conserves and promotes Northern Ireland’s historic environment and has gathered a wealth of information for present and future However a lot of data is done using paper forms or with inconsistant data collection methods.

Coral aims to use Arches to collate data in one place for all the teams across the country.
Currently, everyone enters data differently and this project is to streamline processes while maintaining shareability of the data.generations to use and enjoy. This information is publicly accessible through HERoNI.

However a lot of data is done using paper forms or with inconsistant data collection methods.

Coral aims to use Arches to collate data in one place for all the teams across the country.

Currently, everyone enters data differently and this project is to streamline processes while maintaining shareability of the data.



<!-- PROJECT STRUCTURE -->
## Project Structure
The Coral-arches project is actually a project that comprised of 2 sub-projects, Coral-arches itself and Arches. Most of the controller logics of Coral-arches is actually embedded in Arches. The project linking is built using Docker.

- `datatypes` Sets up data types that are used in Coral
- `functions` Various helper functions that are used throughout the project
- `install` States what are the requirements of the project (currently only Arches)
- `management` Scripts for adding permissions
- `media` The logic of the project is here. The JS files are added through webpack with Arches
- `templates` The view of the project. Contains the HTML files used to render the project in the browser


```
├── coral
│   ├── celery.py
│   ├── datatypes
│   ├── functions
│   ├── __init__.py
│   ├── install
│   ├── logs
│   ├── management
│   ├── media
│   ├── package.json
│   ├── permissions
│   ├── pkg
│   ├── plugins
│   ├── __pycache__
│   ├── reports
│   ├── search_components
│   ├── search_indexes
│   ├── settings_local.py
│   ├── settings.py
│   ├── system_settings
│   ├── templates
│   ├── uploadedfiles
│   ├── urls.py
│   ├── utils
│   ├── views
│   ├── webpack
│   ├── widgets
│   ├── wsgi.py
│   └── yarn.lock

```


<!-- GETTING STARTED -->
## Getting Started

This is an example of how you may give instructions on setting up your project locally.
To get a local copy up and running follow these simple example steps.

### Prerequisite

Docker Engine: Docker version  25.0.0 <br />
Docker-compose standalone: v2.24.2 <br />
Python3 venv  

The installation guide for the dockers are here:
* [Docker Engine](https://docs.docker.com/compose/install/linux/)
* [Docker Compose](https://docs.docker.com/compose/install/standalone/)

Both docker and docker-compose must be able to be run without sudo. It is possible to check it by running this commands seperately
```
docker-compose -v
docker -v
docker run hello-world
```

In case docker compose requires sudo, run this command (a restart is required afterward!)
```
sudo chmod a+x /usr/local/bin/docker-compose
```

If there is no python virtual environment installed in your machine, use this command to install python venv
```
sudo apt install python3.10-venv
```

### Installation Guide [For Linux User]

To get started with the coral-arches main branch you need to follow the following step:
1. Clone the repository by running the following command in your terminal:
```
git clone <https://github.com/flaxandteal/coral-arches/tree/main>
```
This will clone the repository into your local machine. A good practice to not bloat your global environment is in the next step:

2. a. Use Python Virtual Environment

```
python3 -m venv coral-python
```

2. b. Activate the virtual environment

```
source /coral-python/bin/activate
```

3. Once the repository is cloned, navigate to the project root folder. Run the following command to initialize and update the submodules:

```
cd coral-arches
git submodule update --init --recursive
```

It will download the submodules needed to run the build file.

4. The final step will be building up the whole project using the makefile in the root folder, using this command:

```
make build
```

for each time you want to run the project, you can just open it in localhost:8000 after running the script

```
make run
```


### Setting up permissions

At first, it is not possible to access the workflows and some other functionalities without setting up the proper permissions. You will need to run these 3 commands in order to set up the whole project properly.

The first two commands imports the resources "Global Set" and "Global Group". It acts as a mock model that acted as a root in a tree-like model of the groups.
```
make manage CMD="packages -o import_business_data -s coral/pkg/business_data/Root\ Set.json -ow overwrite"

make manage CMD="packages -o import_business_data -s coral/pkg/business_data/Root\ Group.json -ow overwrite"
```



Initializes the permission table, it allows all of the users within the system to be assigned the proper permissions. 
```
make manage CMD="print_permissions_table"
```

## Updating Arches Versions

If updating the arches version there are several places to update the version number to ensure arches is synced locally and in the build.

### Local
You need to update the Make file within the project, not in the docker submodule

`ARCHES_BASE = ghcr.io/flaxandteal/arches-base:v8.2.0a4-v4`

This line can be changed to use the appropriate base image.

The base images are created by Flax and Teal and use an arches base version with additional patches applied to work with our container set up.

Changing this ensures when `make build` is ran, the correct base image is used to build arches

### pyproject.toml
The `pyproject.toml` also needs to be updated so that you are pinned to the exact version needed

```
dependencies = [
    "arches>=8.1.0,<=8.2.0a4"
]
```

This can be set to a range or an exact version.
Here we have pinned to an upper limit that matches our base image. If this is set higher, on a build the latest version will be pulled and may not match our base image.

This step is important, we do not want to drift from the base image version. This will not be immediately apparent as arches will still run.

### Github Action
The final place to update is within the github actions. These control the builds that are pushed to the environments.

Both `project.yml` and `release.yml` need the `ARCHES_BASE` updated to match the above.

```
ARCHES_BASE: ghcr.io/flaxandteal/arches-base:v8.2.0a4-v4
```

### Contribution 

We welcome contributions! To learn the project in more details, check out the [Coral Onboarding Page](https://github.com/flaxandteal/coral-arches/wiki)
