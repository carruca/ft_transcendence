FROM alpine:3.15
RUN apk update && apk add --no-cache \
	vim \
	git \
	nodejs \
	npm \
	&& rm -f /var/cache/apk/*

RUN npm i -g @nestjs/cli
#	&& nest new backend --strict --package-manager npm

WORKDIR /backend

EXPOSE 3000 22

#ENTRYPOINT ["/bin/sh"]
ENTRYPOINT ["/usr/local/bin/npm", "run", "start:dev"]
