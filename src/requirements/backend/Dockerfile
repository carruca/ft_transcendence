FROM alpine:3.15
RUN apk update && apk add \
	vim \
	nodejs \
	npm \
	git \
	openssh \
	&& rm -f /var/cache/apk/*
RUN npm i -g @nestjs/cli@8.2.6
#	&& nest new backend --package-manager npm

EXPOSE 3000 22
WORKDIR /backend

#ENTRYPOINT ["/bin/sh"]
ENTRYPOINT ["/usr/bin/npm", "run", "start:dev"]

