# Phase 3 Deployment: AWS + Kubernetes

This directory contains Kubernetes manifests for deploying the app to EKS.

## Prerequisites

- AWS account with permissions for VPC, EKS, EC2, IAM
- Terraform `>= 1.6`
- `aws` CLI configured
- `kubectl`
- `helm`

## 1. Provision AWS infrastructure (EKS)

```bash
cd infra/terraform/aws
cp terraform.tfvars.example terraform.tfvars
terraform init
terraform plan
terraform apply
```

Configure kubectl using the Terraform output command:

```bash
aws eks update-kubeconfig --region <region> --name <cluster-name>
```

## 2. Install NGINX ingress controller

```bash
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo update
helm upgrade --install ingress-nginx ingress-nginx/ingress-nginx \
  --namespace ingress-nginx --create-namespace
```

## 3. Configure app manifests

Update these files before applying:

- `k8s/base/app-secrets.yaml`
: set a strong `SECRET_KEY`
- `k8s/base/ingress.yaml`
: set your real DNS host (replace `gym.example.com`)
- `k8s/base/backend.yaml` and `k8s/base/frontend.yaml`
: pin to explicit image tags (recommended), not only `latest`

If GHCR packages are private, create an image pull secret:

```bash
kubectl create secret docker-registry ghcr-pull-secret \
  --namespace gym \
  --docker-server=ghcr.io \
  --docker-username=<github-username> \
  --docker-password=<github-token>
```

Then add `imagePullSecrets` to backend/frontend deployment specs.

## 4. Deploy app

```bash
kubectl apply -k k8s/base
```

Check rollout:

```bash
kubectl -n gym get pods,svc,ingress
kubectl -n gym rollout status deploy/backend
kubectl -n gym rollout status deploy/frontend
```

## 5. Upgrade images

```bash
kubectl -n gym set image deployment/backend backend=ghcr.io/alexmachulsky/gym-app-backend:<tag>
kubectl -n gym set image deployment/frontend frontend=ghcr.io/alexmachulsky/gym-app-frontend:<tag>
```

## Cleanup

```bash
kubectl delete -k k8s/base
cd infra/terraform/aws
terraform destroy
```
