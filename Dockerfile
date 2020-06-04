FROM node:14
LABEL maintainer="dmitriym.09.12.1989@gmail.com"

COPY . .

RUN npm ci --prod

EXPOSE 3000

ENTRYPOINT ["npm", "run", "microservice"]