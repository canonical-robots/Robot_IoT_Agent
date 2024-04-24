#!/bin/bash

if [ "$1" = "clear" ]; then
    # Stop running containers
    docker-compose stop

    # Remove stopped containers
    docker-compose rm -f
else
    # Stop running containers
    docker-compose stop

    # Remove stopped containers
    docker-compose rm -f

    # Recreate and start containers
    docker-compose up -d
fi

docker-compose logs -f
