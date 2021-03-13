#!/bin/bash

if [ $# -ne 1 ]; then
  echo "This commands needs one argument: a smee link"
  echo "You can get one by going to https://smee.io/new"
  exit 1
fi

yarn concurrently "yarn smee -u $1 --path /api/webhooks" "dotenv -- vercel dev"
