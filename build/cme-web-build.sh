#!/bin/bash

# Run this script to build the Cme-web (Cme web application
# layer) distribution tarball that can be downloaded to a CME device
# and installed.

CME_WEB_PN=1500-007

SRC=$(pwd) # project dist folder (built web files)
DIST=${SRC}/dist # copy here to generate package

# Read the VERSION file to use in the created archive name
VERSION=`perl -nle 'print $& if m{("version"\s*:\s*")\K([^"])*}' package.json`

PACKAGE=${CME_WEB_PN}-v${VERSION}-SWARE-CME_WEB.tgz

echo
echo "  Building Cme-web package: "${PACKAGE}
echo

# Copy files over to dist/
mkdir -p ${DIST}
pushd ${DIST}
cp ${SRC}/*.html .
cp ${SRC}/*.otf .
cp ${SRC}/favicon.ico .
cp ${SRC}/bundle.js .
cp ${SRC}/style.css .
cp -R ${SRC}/legal .

tar -czvf ../${PACKAGE} .

# Done with the built distribution
popd
rm -rf ${DIST}

echo "Done!"
