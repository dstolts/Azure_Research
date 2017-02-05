FROM node:latest

RUN mkdir -p /usr/src
WORKDIR /usr/src

RUN npm install -g bower gulp
RUN npm install --save-dev gulp

RUN	groupadd -r node \
&&	useradd -r -m -g node node

COPY . /usr/src/
RUN rm -rf /usr/src/node_modules
RUN chown -R node:node /usr/src

# compile app
USER node
RUN touch /home/node/.mean
RUN npm install
RUN bower install
RUN gulp run

ENV PORT 3000

CMD [ "gulp", "run" ]
EXPOSE 3000