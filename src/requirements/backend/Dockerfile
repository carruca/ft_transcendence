FROM node:18-alpine3.15 as dev
RUN apk update && apk add \
	vim \
	git \
	openssh \
	&& rm -f /var/cache/apk/*
RUN npm i -g @nestjs/cli@8.2.6
#	&& nest new backend --package-manager npm

EXPOSE 3000 22
WORKDIR /backend

#ENTRYPOINT ["/bin/sh"]
ENTRYPOINT ["/usr/local/bin/npm", "run", "start:dev"]

