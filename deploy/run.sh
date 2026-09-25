#!/bin/sh
set -eu

: "${BUILD_NUMBER:?BUILD_NUMBER is required}"

sed 's/\${TAG}/'"$BUILD_NUMBER"'/g' deploy/production/studio-deployment.yaml | kubectl apply -f -
kubectl apply -f deploy/production/studio-service.yaml
bash deploy/apply-studio-proxy.sh
kubectl apply -f deploy/production/legacy-hub-redirect.yaml
kubectl apply -f deploy/production/studio-ingress.yaml
