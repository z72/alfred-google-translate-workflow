#!/bin/bash
pid="$(./get-server-pid.sh)"
if [ -n "$pid" ]; then
  kill "$pid"
else
  echo "Server is not running."
fi
