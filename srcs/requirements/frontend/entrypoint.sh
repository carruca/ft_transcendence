#!/bin/sh
check-installed-dependencies
if [ "$?" -eq 1 ]; then
	npm i
fi
exec npm run dev -- --host

#npm run build
#exec npm run serve
