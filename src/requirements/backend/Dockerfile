FROM alpine:3.15
RUN apk update && apk add --no-cache \
	vim \
	git \
	nodejs \
	npm \
	&& rm -f /var/cache/apk/*

#COPY ./vol/package*.json ./
#RUN npm install
RUN npm i -g @nestjs/cli
RUN npm i -g @nestjs/common
RUN npm i -g @nestjs/core
#	&& nest new backend --strict --package-manager npm

#RUN nest update
COPY entrypoint.sh .
WORKDIR /backend

EXPOSE 3000 22

#ENTRYPOINT ["/bin/sh"]
#ENTRYPOINT ["/usr/local/bin/node", "dist/main"]
ENTRYPOINT ["/entrypoint.sh"]
#ENTRYPOINT ["/usr/local/bin/npm", "run", "start:dev"]
