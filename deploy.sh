#!/bin/bash

read -p "Enter release version: " VERSION

docker build -t mjvolk/calendarnotes:$VERSION .
docker push mjvolk/calendarnotes:$VERSION
ssh calendarnotes-api "docker pull mjvolk/calendarnotes:$VERSION && docker tag mjvolk/calendarnotes:$VERSION dokku/api:$VERSION && dokku tags:deploy api $VERSION"
