# Docker Deployment

## Requirements

Install [Docker](https://www.docker.com/), to ensure you can execute `docker` command:

```
$ docker
Usage:  docker [OPTIONS] COMMAND

A self-sufficient runtime for containers

Common Commands:
  run         Create and run a new container from an image
  exec        Execute a command in a running container
  ps          List containers
  build       Build an image from a Dockerfile
  pull        Download an image from a registry
  push        Upload an image to a registry
...
```

## Login to Docker

Register an account in [Docker Hub](https://hub.docker.com/), then use command to login:

```
docker login
```

Then enter your username and password to login, then you will see like:

```
Login Succeeded
```

## Build with Docker

```
docker build -t <username>/<image> .
```

Replace `<username>` to your username in Docker Hub, and replace `<image>` with any name you want as the image name, like:

```
docker build -t foobar/hub .
```

Then you will see like this:

```
[+] Building 5.9s (8/16)                                                                                    docker:desktop-linux
 => [build-stage 1/6] FROM docker.io/library/node:18@sha256:995a5f4314885452a4a785abc25a0fec40e26c346559e11e709d58bb7a927c  2.0s
 => => resolve docker.io/library/node:18@sha256:995a5f4314885452a4a785abc25a0fec40e26c346559e11e709d58bb7a927cf4            0.0s
 => => sha256:30d85599795460b2d9d24c6b87c53ec60555b601705cc83bea31632240500980 0B / 64.14MB                                 2.0s
 => => sha256:995a5f4314885452a4a785abc25a0fec40e26c346559e11e709d58bb7a927cf4 1.21kB / 1.21kB                              0.0s
 => => sha256:084b3c822003a20d41f793237286e112d1b5a1c0c7b8b04cb53a17a963a76ed7 2.00kB / 2.00kB                              0.0s
 => => sha256:ef847f8b5ae3554df13851034f22683a8b9aef31b3659033211775d8d6cb6b79 7.34kB / 7.34kB
 ...
=> [build-stage 4/6] RUN yarn                                                                                             83.5s
 => [build-stage 5/6] COPY . .                                                                                              0.3s
 => [build-stage 6/6] RUN yarn build                                                                                       16.3s
 => [production-stage 2/3] COPY --from=build-stage /app/dist /usr/share/nginx/html                                          0.0s
 => [production-stage 3/3] COPY nginx.conf /etc/nginx/conf.d/default.conf                                                   0.0s
 => exporting to image                                                                                                      0.0s
 => => exporting layers                                                                                                     0.0s
 => => writing image sha256:f4e06895b43560b3cd43970c8942f35d56643959de5272eebee1a887a1b7798a                                0.0s
 => => naming to docker.io/germey/hub
```

## Push Docker

```
docker push <username>/<image>
```

Now you have pushed your image to Docker Hub, then you can deploy this image to any server.

## Deploy Docker

In your server machine, you can then pull this image and then run it

```
docker run -d -p 8000:80 <username>/<image>
```

Then visit [http://localhost:8000](http://localhost:8000) you will see it.

## Configure HTTPS

If you want to configure HTTPS and domain, like example.abc.com, you can install Nginx to forward the traffic from Docker:

Apply the HTTPS cert for your domain, you will have 2 files, one is cert, the other is private key, like `example.abc.com.pem` and `example.abc.com.key`, change the nginx conf file as below:

```
server {
    listen       443;
    server_name  example.abc.com;

    ssl_certificate /path/to/your/example.abc.com.pem;
    ssl_certificate_key /path/to/your/example.abc.com.key;

    location / {
        proxy_pass http://127.0.0.1:8000;
    }
}
```

Also please set the Domain to server's ip address, then restart nginx, it will work.
