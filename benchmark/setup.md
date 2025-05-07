# Introduction
Welcome to the bench marking branch to test out if arches orm (0.2.5) is faster than arches orm (0.2.2). This branch is based on a [excel sheet document](https://docs.google.com/spreadsheets/d/1v6JkQWdgSOs49MQop_z-L88Z01kkjxUctowI0lYLsOk/edit?gid=0#gid=0) and uses the data based on the seed data within this branch.

# Version
- **dev**: 7.11.41
- **date**: 07-05-2025
- **target arches orm**: 0.2.2
- **challenger arches orm**: 0.2.5

# Setup
## Project Setup
*Please note that the project setup does require the complete DROP of the arches database so all data will be lost following this setup*

### 1 - Initial
Make sure that the project is built `make build` and ran `make run`
### 2 - Import Database
Copy and paste the database SQL over to the docker container
```
sudo docker cp ./benchmark/seed/dev.sql coral-db-1:/dev.sql
```

Access the docker DB container
```
sudo docker exec -it coral-db-1 /bin/bash
```

Login into the database *hint: password is **postgres***
```
psql -h localhost -U postgres -d postgres
```

Run this command in psql to remove any connected user to arches
```
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE datname = 'arches'
  AND pid <> pg_backend_pid();
```

Then drop the database `arches` and create the database `arches` to get a refresh new empty database
```
DROP DATABASE arches;
CREATE DATABASE arches;
```

Exit out of psql CLI
```
exit
```

Finally run this below to import the database data
```
psql -U postgres -d arches -f /dev.sql -h localhost
```

### 3 - Restart 
Now just restart the containers
```
make stop
make run
```

# Curl
There is curl commands for the three dashboards, however you have to apply the token within the config file, depending on the curl command you 
want to run for example for the planning curl commands update the `planning_config.env` token inside.


## Example of running curl command
```
sh page_control.sh
```

# Users Accounts
## Records and Designation
- **Username:** record_and_designation_manager
- **Email:** record_and_designation_manager@test.com
- **Password:** Password!1

## Exavation
- **Username:** excavation_admin
- **Email:** excavation_admin@test.com
- **Password:** Password!1

## Planning
- **Username:** planning_admin
- **Email:** planning_admin@test.com
- **Password:** Password!1