#!/bin/bash
set -e

curl -O https://codeload.github.com/z72/alfred-google-translate-workflow/zip/master
unzip master
mv -f alfred-google-translate-workflow-master/* ./
rm -r alfred-google-translate-workflow-master
rm master

./restart-server.sh
