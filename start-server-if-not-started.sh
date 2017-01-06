#!/bin/bash
pid="$(./get-server-pid.sh)"
if [ -n "$pid" ]; then
  echo "Server is running."
else
  ./start-server.sh
  sleep 5
fi
