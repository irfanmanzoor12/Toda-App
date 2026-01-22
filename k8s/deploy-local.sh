#!/bin/bash
# Local Minikube Deployment Script for TodoApp
# TASK-051 to TASK-066: Infrastructure Setup

set -e

echo "=== TodoApp Local Kubernetes Deployment ==="

# Check prerequisites
command -v minikube >/dev/null 2>&1 || { echo "minikube required but not installed."; exit 1; }
command -v kubectl >/dev/null 2>&1 || { echo "kubectl required but not installed."; exit 1; }
command -v dapr >/dev/null 2>&1 || { echo "dapr CLI required but not installed."; exit 1; }

# Step 1: Start Minikube if not running
echo "Step 1: Starting Minikube..."
if ! minikube status | grep -q "Running"; then
    # Use 4GB RAM for systems with limited memory
    minikube start --cpus=2 --memory=4096 --driver=docker
fi

# Enable required addons
minikube addons enable ingress
minikube addons enable metrics-server

# Step 2: Install Strimzi (Kafka Operator)
echo "Step 2: Installing Strimzi Kafka Operator..."
kubectl create namespace kafka --dry-run=client -o yaml | kubectl apply -f -
kubectl apply -f 'https://strimzi.io/install/latest?namespace=kafka' -n kafka
echo "Waiting for Strimzi operator..."
kubectl wait --for=condition=ready pod -l name=strimzi-cluster-operator -n kafka --timeout=300s

# Step 3: Deploy Kafka Cluster (lightweight for local)
echo "Step 3: Deploying Kafka Cluster..."
kubectl apply -f kafka/minikube-kafka-cluster.yaml -n kafka
echo "Waiting for Kafka cluster (this may take a few minutes)..."
kubectl wait kafka/kafka-cluster --for=condition=Ready --timeout=600s -n kafka || true

# Step 4: Create Kafka Topics
echo "Step 4: Creating Kafka Topics..."
kubectl apply -f kafka/topics.yaml -n kafka

# Step 5: Install Dapr
echo "Step 5: Installing Dapr..."
dapr init -k --wait --runtime-version 1.12
kubectl wait --for=condition=ready pod -l app=dapr-operator -n dapr-system --timeout=300s

# Step 6: Install Redis (for Dapr State Store)
echo "Step 6: Installing Redis..."
helm repo add bitnami https://charts.bitnami.com/bitnami 2>/dev/null || true
helm upgrade --install redis bitnami/redis --set auth.enabled=false --wait

# Step 7: Apply Dapr Components
echo "Step 7: Configuring Dapr Components..."
kubectl apply -f dapr/components/
kubectl apply -f dapr/bindings/

# Step 8: Create Secrets
echo "Step 8: Creating App Secrets..."
if [ -f ../.env.local ]; then
    kubectl create secret generic app-secrets --from-env-file=../.env.local --dry-run=client -o yaml | kubectl apply -f -
else
    echo "Warning: .env.local not found. Please create secrets manually."
    echo "kubectl create secret generic app-secrets --from-literal=DATABASE_URL=... --from-literal=OPENAI_API_KEY=..."
fi

# Step 9: Deploy Services
echo "Step 9: Deploying Services..."
kubectl apply -f deployments/
kubectl apply -f ingress/

# Step 10: Wait for Deployments
echo "Step 10: Waiting for deployments..."
kubectl rollout status deployment/task-service --timeout=300s || true
kubectl rollout status deployment/frontend --timeout=300s || true

# Step 11: Add hosts entry
MINIKUBE_IP=$(minikube ip)
echo ""
echo "=== Deployment Complete ==="
echo ""
echo "Add the following to /etc/hosts (or C:\\Windows\\System32\\drivers\\etc\\hosts on Windows):"
echo "$MINIKUBE_IP todoapp.local api.todoapp.local"
echo ""
echo "Access the application:"
echo "  Frontend: http://todoapp.local"
echo "  API: http://api.todoapp.local/api/todos"
echo ""
echo "Useful commands:"
echo "  kubectl get pods                    # View all pods"
echo "  kubectl logs -f deployment/task-service  # View task service logs"
echo "  minikube dashboard                  # Open Kubernetes dashboard"
echo "  dapr dashboard -k                   # Open Dapr dashboard"
