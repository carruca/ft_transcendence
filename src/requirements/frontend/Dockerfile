FROM alpine:3.18.4
RUN apk update && apk add --no-cache \
	vim \
	git \
	nodejs \
	npm \
	&& rm -f /var/cache/apk/*

RUN npm i -g check-installed-dependencies

COPY entrypoint.sh ./

WORKDIR /frontend

ENTRYPOINT ["/entrypoint.sh"]
