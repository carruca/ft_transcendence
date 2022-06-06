FROM node:18-alpine3.15 as dev
RUN apk update && apk add \
	vim \
	git \
	openssh \
	&& rm -f /var/cache/apk/*

WORKDIR /backend

COPY ./vol/package*.json .
#RUN npm i -g @nestjs/cli
RUN npm install

#RUN nest update
#	&& nest new backend --package-manager npm

EXPOSE 3000 22

#ENTRYPOINT ["/bin/sh"]
ENTRYPOINT ["/usr/local/bin/node", "dist/main"]
#ENTRYPOINT ["/usr/local/bin/npm", "run", "start:dev"]

