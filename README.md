# Coral Arches

This Arches implementation is designed to be run with Kubernetes and Dockerized.

In addition, it uses Casbin permissions and a patched version of Arches.

This is in-development software: no warranty is made for open source use as regards
the reliability, consistency, security or stability at this point.

## Installation

You can install Arches, if you have docker-compose working already by:

    git clone git@github.com:flaxandteal/coral-arches
    OR (if you have no permissions)
    git clone https://github.com/flaxandteal/coral-arches
    git submodule update --init
    make build
    make run

For more information, see the Flax &amp; Teal
[Arches Container Toolkit](https://github.com/flaxandteal/arches-container-toolkit/).
