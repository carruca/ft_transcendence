FROM node:18-alpine
RUN apk update && apk add \
	git \
	&& rm -f /var/cache/apk/*


#COPY ./vol/package*.json ./
#RUN npm install
RUN npm i -g @nestjs/cli
#	&& nest new backend --package-manager npm

#RUN nest update
COPY entrypoint.sh .
WORKDIR /backend

EXPOSE 3000 22

#ENTRYPOINT ["/bin/sh"]
#ENTRYPOINT ["/usr/local/bin/node", "dist/main"]
ENTRYPOINT ["sh", "/entrypoint.sh"]
#ENTRYPOINT ["/usr/local/bin/npm", "run", "start:dev"]
