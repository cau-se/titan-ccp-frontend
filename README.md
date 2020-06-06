# Titan Control Center - Visualization Frontend

The [Titan Control Center](https://ieeexplore.ieee.org/abstract/document/8822045)
is a scalable monitoring infrastructure for [Industrial DevOps](https://industrial-devops.org/).
It allows to monitor, analyze and visualize the electrical power consumption of
devices and machines in industrial production environments.

This repository contains the visualization frontend of the Titan Control Center. It is a
single-page application written in Typescript and Vue.js.

## Developing

To work on this project, clone this repository and execute:

```shell
npm install
```

In order to start a development server running on `http://localhost:8070` execute:

```shell
npm run dev
```

A good tool for working on this software is [Visual Studio Code](https://code.visualstudio.com/).
In order to get things like autocompletion for `.vue` files, you need to install
the [vetur](https://vuejs.github.io/vetur/) plugin. When you open a vue file the
first time, Visual Studio Code suggests to install this plugin. Further, the
[ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)
plugin should be installed to get notifications on violated coding guideline
already during developing.

The visualization frontend highly depends on external data sources, more
specifically, the other Titan CCP microservices. In order to let the frontend
access them, you need to start a reverse proxy that redirects all calls to
the other services. We provide such a reverse proxy as part of the frontend,
which can be started be started via:

```shell
docker run --rm --name titan-ccp-frontend --network host -e "SENSOR_MANAGEMENT_BASE_URL=http://<host>:<port>" -e "HISTORY_BASE_URL=http://<host>:<port>" -e "STATS_BASE_URL=http://<host>:<port>" -d industrialdevops/titan-ccp-frontend
```

Note: The application intended for development is running at port 8070, whereas a the
application running at port 8080 is the compiled one running in the Docker container.
If you want to build this reverse proxy by yourself, follow the steps described below.

## Building

To build the visualization frontend for use in production execute:

```shell
npm install
npm run build
```

This will create some files in `dist`. These files along with the `index.html`
can then be copied on a web server for productive usage.

This repository also contains a Dockerfile. Adjust the `nginx.conf` file accordingly
and run `docker build -t titan-ccp-frontend .` to create an image from it (after
building it with npm).

## Running

To start a container execute:

```shell
docker run --rm --name titan-ccp-frontend -p <port>:8080 -e "SENSOR_MANAGEMENT_BASE_URL=http://<host>:<port>" -e "HISTORY_BASE_URL=http://<host>:<port>" -e "STATS_BASE_URL=http://<host>:<port>" -d titan-ccp-frontend
```