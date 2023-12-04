#!/bin/sh
check-installed-dependencies
if [ "$?" -eq 1 ]; then
	npm i
fi
exec npm run start:debug

npm run build
exec npm run start:prod
