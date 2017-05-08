#!/bin/bash
set -e

# Get the putS3 function
source $HOME/.bashrc

SRC=$(pwd)  # run from project source folder
APP=${SRC##*/}

CME_WEB_PN=1500-007

# Increment VERSION build number; the '123' in 1.0.0-123
VERSION=`perl -nle 'print $& if m{("version"\s*:\s*")\K([^"])*}' package.json`
IFS='-' read -ra PARTS <<< "${VERSION}"
BUILD_NUMBER=${PARTS[1]}
((BUILD_NUMBER++))

# Set the new version (don't tag/commit)
npm --no-git-tag-version version "${PARTS[0]}-${BUILD_NUMBER}"

# read the version from package.json
VERSION=`perl -nle 'print $& if m{("version"\s*:\s*")\K([^"])*}' package.json`

BASENAME=${CME_WEB_PN}-v${VERSION}-SWARE-CME_WEB

PACKAGE=${BASENAME}.tgz
DOCKER_PKG=${BASENAME}.pkg.tgz
DOCKER_NAME=cmeweb:${VERSION}

# Stage 1.  Build and publish base (recovery) package
echo
echo "    Stage 1.  Building and publishing base package: ${PACKAGE} ..."
echo

# Build base image
build/build.sh 

echo
echo "    ... done building."
echo

# Publish base image to S3
cd build
putS3 ${PACKAGE} Cme
cd ..

# Stage 2.  Build and publish docker package
echo
echo "    Stage 2.  Building and publishing docker package: ${DOCKER_PKG} ..."
echo

# Use docker package binaries and build docker app image
cd build
docker build -t ${DOCKER_NAME} --build-arg version=${VERSION} .

echo
echo "    ... done building docker image."
echo "        Now saving docker image into package ..."
echo

# Save docker image to package
docker save ${DOCKER_NAME} | gzip > ${DOCKER_PKG}

echo
echo "    ... done saving docker image into package."
echo "        Finally, publishing docker package ..."
echo

putS3 ${DOCKER_PKG} Cme
cd ../

echo
echo "    ... All done!"
echo
