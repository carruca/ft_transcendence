#!/bin/sh
check-installed-dependencies
if [ "$?" -eq 1 ]; then
	npm i
fi
#npm run build

exec npm run start:debug
#exec npm run start:prod
