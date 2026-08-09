#!/bin/sh
set -eu

: "${BUILD_NUMBER:?BUILD_NUMBER is required}"
: "${GITHUB_SHA:?GITHUB_SHA is required}"

sed 's/\${TAG}/'"$BUILD_NUMBER"'/g' deploy/production/deployment.yaml | kubectl apply -f -
kubectl apply -f deploy/production/service.yaml

sed 's/\${TAG}/'"$BUILD_NUMBER"'/g' deploy/production/studio-deployment.yaml | kubectl apply -f -
kubectl apply -f deploy/production/studio-service.yaml
kubectl apply -f deploy/production/studio-ingress.yaml
kubectl apply -f deploy/production/studio-proxy.yaml

kubectl rollout status deployment/hub-frontend -n acedatacloud --timeout=10m
kubectl rollout status deployment/studio-frontend -n acedatacloud --timeout=10m

expected_image="ghcr.io/acedatacloud/hub-frontend:$BUILD_NUMBER"
hub_image=$(kubectl get deployment hub-frontend -n acedatacloud -o jsonpath='{.spec.template.spec.containers[0].image}')
studio_image=$(kubectl get deployment studio-frontend -n acedatacloud -o jsonpath='{.spec.template.spec.containers[0].image}')
test "$hub_image" = "$expected_image"
test "$studio_image" = "$expected_image"

for deployment in hub-frontend studio-frontend; do
  kubectl annotate deployment "$deployment" -n acedatacloud \
    "acedata.cloud/last-successful-revision=$GITHUB_SHA" --overwrite
done
