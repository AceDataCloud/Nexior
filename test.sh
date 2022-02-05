docker-compose build
docker-compose push
cat deploy/test/deployment.yaml | sed 's/\${TAG}/'"$BUILD_NUMBER"'/g' | kubectl apply -f - || true