# The existing Platform router dispatches API paths to their owning services.
# Preserve the first edge hop's visitor address through the internal router.
proxy_pass http://platform-frontend.acedatacloud.svc.cluster.local:8083;
proxy_set_header Host platform.acedata.cloud;
proxy_set_header X-Forwarded-Proto https;
proxy_set_header Client-IP $http_client_ip;
