FROM alpine:3.17
RUN apk update && apk add --no-cache \
	vim \
	git \
	nodejs \
	npm \
	&& rm -f /var/cache/apk/*

#RUN npm i -g react-scripts
#RUN npm i -g check-installed-dependencies
#RUN npm i -g create-react-app
#	&& npm init react-app sample --use-npm

COPY entrypoint.sh ./

WORKDIR /frontend

#EXPOSE 5173

#ENTRYPOINT ["sh"]
ENTRYPOINT ["/entrypoint.sh"]

