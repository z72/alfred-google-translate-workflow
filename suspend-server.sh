#!/bin/bash
pid="$(./get-server-pid.sh)"
if [ -n "$pid" ]; then
  kill -TSTP "$pid"
else
  echo "Server is not running."
fi
