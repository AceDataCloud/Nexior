cat deploy/production/deployment.yaml | sed 's/\${TAG}/'"$BUILD_NUMBER"'/g' | kubectl apply -f - || true
kubectl apply -f deploy/production/service.yaml

cat deploy/production/studio-deployment.yaml | sed 's/\${TAG}/'"$BUILD_NUMBER"'/g' | kubectl apply -f - || true
kubectl apply -f deploy/production/studio-service.yaml
kubectl apply -f deploy/production/studio-ingress.yaml

# Caddy reverse proxy for tenant custom domains (mybrand.com -> studio-frontend
# with on-demand Let's Encrypt TLS). Idempotent; safe to re-apply on every
# deploy. The Service provisions a separate public CLB the first time it
# runs; subsequent applies are no-ops on the LB.
kubectl apply -f deploy/production/tenant-proxy.yaml
