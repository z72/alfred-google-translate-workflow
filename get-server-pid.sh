#!/bin/bash
echo "$(lsof -n -i4TCP:54234 | grep LISTEN | cut -d ' ' -f 2)"
