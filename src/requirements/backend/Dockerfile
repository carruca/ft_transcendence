FROM alpine:3.15
RUN apk update && apk add vim nodejs npm git openssh
RUN npm i -g @nestjs/cli

EXPOSE 3000 22
WORKDIR /backend

#ENTRYPOINT ["/bin/sh"]
ENTRYPOINT ["/usr/bin/npm", "run", "start:dev"]

