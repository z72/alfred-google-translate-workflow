#!/bin/bash
pid="$(./get-server-pid.sh)"
if [ -n "$pid" ]; then
  ./resume-server.sh
else
  LOCKFILE=start-server-lock.txt
  if [ -e ${LOCKFILE} ] && kill -0 `cat ${LOCKFILE}`; then
    sleep 5
    exit
  fi

  trap "rm -f ${LOCKFILE}; exit" INT TERM EXIT
  echo $$ > ${LOCKFILE}

  ./start-server.sh
  sleep 5

  rm -f ${LOCKFILE}
fi
