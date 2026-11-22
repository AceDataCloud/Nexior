# The existing Platform router dispatches API paths to their owning services.
# Forward the edge-provided headers only to this fixed cluster destination.
proxy_pass http://platform-frontend.acedatacloud.svc.cluster.local:8083;
proxy_set_header Host platform.acedata.cloud;
proxy_set_header X-Forwarded-Proto https;
proxy_set_header Client-IP $http_client_ip;
proxy_set_header X-Ace-Platform-Edge-Origin-Auth $http_x_ace_platform_edge_origin_auth;
