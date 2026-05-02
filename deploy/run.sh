cat deploy/production/deployment.yaml | sed 's/\${TAG}/'"$BUILD_NUMBER"'/g' | kubectl apply -f - || true
kubectl apply -f deploy/production/service.yaml

cat deploy/production/studio-deployment.yaml | sed 's/\${TAG}/'"$BUILD_NUMBER"'/g' | kubectl apply -f - || true
kubectl apply -f deploy/production/studio-service.yaml
kubectl apply -f deploy/production/studio-ingress.yaml
