# Self-hosted Nexior connects to the public platform endpoint.
proxy_pass https://platform.acedata.cloud;
proxy_set_header Host platform.acedata.cloud;
proxy_set_header X-Ace-Platform-Edge-Origin-Auth "";
