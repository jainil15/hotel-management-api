#!/bin/bash

echo IMAGE_NAME=$IMAGE_NAME > .env
echo IMAGE_TAG=$IMAGE_TAG >> .env

# Add variables here
echo PORT=$PORT >> .env
echo MONGODB_URL=$MONGODB_URI >> .env
echo ACCESS_TOKEN_SECRET=$ACCESS_TOKEN_SECRET >> .env
echo REFRESH_TOKEN_SECRET=$REFRESH_TOKEN_SECRET >> .env
echo FRONTEND_URL=$FRONTEND_URL >> .env