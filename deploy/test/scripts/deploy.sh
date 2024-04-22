cat deploy/test/deployment.yaml | sed 's/\${TAG}/'"$BUILD_NUMBER"'/g' | kubectl apply -f - || true
kubectl apply -f deploy/test/service.yaml
