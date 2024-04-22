cat deploy/production/deployment.yaml | sed 's/\${TAG}/'"$BUILD_NUMBER"'/g' | kubectl apply -f - || true
kubectl apply -f deploy/production/service.yaml
