#!/bin/sh
check-installed-dependencies
if [ "$?" -eq 1 ]; then
	npm ci
fi
exec npm run start:dev
