FROM node:14
LABEL maintainer="dmitriym.09.12.1989@gmail.com"

RUN usermod -u 5151 node && \
    groupmod -g 5151 node

WORKDIR /opt/app

COPY . .

RUN npm ci --prod && \
    chown -R node:node .

USER node:node

EXPOSE 3000

ENTRYPOINT ["npm", "run", "microservice"]