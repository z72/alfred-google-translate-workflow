#!/bin/bash
pid="$(./get-server-pid.sh)"
if [ -n "$pid" ]; then
  echo "Server is running."
else
  (./translation-server.js &) &
fi
