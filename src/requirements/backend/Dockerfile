FROM alpine:3.15
RUN apk update && apk add --no-cache \
	vim \
	git \
	nodejs \
	npm \
	&& rm -f /var/cache/apk/*

RUN npm i -g @nestjs/cli
#	&& nest new backend --strict --package-manager npm

COPY entrypoint.sh ./

WORKDIR /backend

EXPOSE 3000

ENTRYPOINT ["/entrypoint.sh"]
