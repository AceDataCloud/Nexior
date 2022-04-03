# Adademy

## Setup domain

Modify the host file, like `/etc/hosts`, add this line:

```
127.0.0.1 academy.local.zhishuyun.com
```

Then save it.

### Generate certs

Run below command to generate certs:

```
yarn run init:https
```

Then install the `.crt` file and trust it.

### Start server

Run below command to start local server:

```
sudo yarn start
```

Then open `https://academy.local.zhishuyun.com` to view the content.
