# TodoApp Kubernetes Infrastructure

Phase V infrastructure for deploying TodoApp on Kubernetes with Dapr and Kafka.

## Architecture

```
                    ┌─────────────────────────────────────────────────────┐
                    │                    Ingress                          │
                    │            (todoapp.local, api.todoapp.local)       │
                    └─────────────────────┬───────────────────────────────┘
                                          │
          ┌───────────────────────────────┼───────────────────────────────┐
          │                               │                               │
          ▼                               ▼                               ▼
   ┌──────────────┐              ┌───────────────┐              ┌──────────────┐
   │   Frontend   │              │ Task Service  │              │ Chat Service │
   │   (Next.js)  │              │  (FastAPI)    │              │   (Node.js)  │
   │    :3000     │              │    :8001      │              │    :3002     │
   └──────────────┘              └───────┬───────┘              └──────┬───────┘
                                         │                             │
                                         │ Dapr Sidecar                │
                                         ▼                             ▼
                    ┌────────────────────────────────────────────────────────┐
                    │                    Dapr Runtime                         │
                    │  ┌─────────┐  ┌──────────┐  ┌─────────┐  ┌──────────┐  │
                    │  │Pub/Sub  │  │  State   │  │ Service │  │ Bindings │  │
                    │  │(Kafka)  │  │ (Redis)  │  │ Invoke  │  │  (Cron)  │  │
                    │  └────┬────┘  └────┬─────┘  └─────────┘  └────┬─────┘  │
                    └───────┼────────────┼──────────────────────────┼────────┘
                            │            │                          │
                            ▼            ▼                          ▼
                    ┌──────────────┐ ┌────────┐          ┌──────────────────┐
                    │    Kafka     │ │ Redis  │          │ Recurrence Svc   │
                    │  (Strimzi)   │ │        │          │ Reminder Svc     │
                    │   :9092      │ │ :6379  │          │  :8002, :8003    │
                    └──────────────┘ └────────┘          └──────────────────┘
```

## Prerequisites

- [Minikube](https://minikube.sigs.k8s.io/docs/start/) v1.32+
- [kubectl](https://kubernetes.io/docs/tasks/tools/) v1.29+
- [Dapr CLI](https://docs.dapr.io/getting-started/install-dapr-cli/) v1.12+
- [Helm](https://helm.sh/docs/intro/install/) v3.14+
- Docker Desktop or containerd

## Quick Start (Local)

```bash
# From k8s directory
chmod +x deploy-local.sh
./deploy-local.sh
```

## Manual Deployment

### 1. Start Minikube

```bash
minikube start --cpus=4 --memory=8192 --driver=docker
minikube addons enable ingress
minikube addons enable metrics-server
```

### 2. Install Strimzi (Kafka Operator)

```bash
kubectl create namespace kafka
kubectl apply -f 'https://strimzi.io/install/latest?namespace=kafka' -n kafka
kubectl wait --for=condition=ready pod -l name=strimzi-cluster-operator -n kafka --timeout=300s
```

### 3. Deploy Kafka Cluster

```bash
# For local development (lightweight)
kubectl apply -f kafka/minikube-kafka-cluster.yaml -n kafka

# For production
kubectl apply -f kafka/kafka-cluster.yaml -n kafka

# Wait for Kafka
kubectl wait kafka/kafka-cluster --for=condition=Ready --timeout=600s -n kafka

# Create topics
kubectl apply -f kafka/topics.yaml -n kafka
```

### 4. Install Dapr

```bash
dapr init -k --wait --runtime-version 1.12
```

### 5. Install Redis

```bash
helm repo add bitnami https://charts.bitnami.com/bitnami
helm install redis bitnami/redis --set auth.enabled=false
```

### 6. Apply Dapr Components

```bash
kubectl apply -f dapr/components/
kubectl apply -f dapr/bindings/
```

### 7. Create Secrets

```bash
# From .env file
kubectl create secret generic app-secrets --from-env-file=../.env.local

# Or manually
kubectl create secret generic app-secrets \
  --from-literal=DATABASE_URL='postgresql://...' \
  --from-literal=OPENAI_API_KEY='sk-...' \
  --from-literal=BETTER_AUTH_SECRET='...'
```

### 8. Deploy Services

```bash
kubectl apply -f deployments/
kubectl apply -f ingress/
```

### 9. Access Application

```bash
# Add to /etc/hosts
echo "$(minikube ip) todoapp.local api.todoapp.local" | sudo tee -a /etc/hosts

# Open frontend
open http://todoapp.local
```

## Directory Structure

```
k8s/
├── kafka/
│   ├── kafka-cluster.yaml          # Production Kafka (3 brokers)
│   ├── minikube-kafka-cluster.yaml # Local Kafka (1 broker)
│   └── topics.yaml                 # Kafka topics
├── dapr/
│   ├── components/
│   │   ├── pubsub.yaml            # Kafka pub/sub
│   │   ├── statestore.yaml        # Redis state store
│   │   └── secrets.yaml           # K8s secrets store
│   └── bindings/
│       ├── cron-recurrence.yaml   # Cron for recurrence service
│       └── cron-reminder.yaml     # Cron for reminder service
├── deployments/
│   ├── task-service.yaml
│   ├── recurrence-service.yaml
│   ├── reminder-service.yaml
│   ├── chat-service.yaml
│   ├── mcp-http-server.yaml
│   └── frontend.yaml
├── ingress/
│   └── ingress.yaml
├── secrets/
│   └── app-secrets.yaml           # Secret template
├── deploy-local.sh                # Local deployment script
└── README.md
```

## Monitoring

```bash
# View pods
kubectl get pods

# View logs
kubectl logs -f deployment/task-service

# Dapr dashboard
dapr dashboard -k

# Kubernetes dashboard
minikube dashboard
```

## Troubleshooting

### Kafka not starting

```bash
kubectl describe kafka kafka-cluster -n kafka
kubectl logs -l strimzi.io/name=kafka-cluster-kafka -n kafka
```

### Dapr sidecar not injecting

```bash
kubectl describe pod <pod-name>
kubectl logs <pod-name> -c daprd
```

### Service not responding

```bash
kubectl port-forward svc/task-service 8001:8001
curl http://localhost:8001/api/health
```

## Cleanup

```bash
# Delete all resources
kubectl delete -f deployments/
kubectl delete -f dapr/
kubectl delete -f kafka/ -n kafka
helm uninstall redis
dapr uninstall -k

# Stop Minikube
minikube stop
```
