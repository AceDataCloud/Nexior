#!/bin/sh
set -eu

: "${BUILD_NUMBER:?BUILD_NUMBER is required}"

sed 's/\${TAG}/'"$BUILD_NUMBER"'/g' deploy/production/studio-deployment.yaml | kubectl apply -f -
kubectl apply -f deploy/production/studio-service.yaml
kubectl apply -f deploy/production/studio-ingress.yaml
kubectl apply -f deploy/production/studio-proxy.yaml
kubectl apply -f deploy/production/legacy-hub-redirect.yaml
