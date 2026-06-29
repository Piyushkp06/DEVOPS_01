# 🚀 DevOps AI Platform

**AI-powered DevOps monitoring, incident management, and autonomous remediation for Kubernetes.**

An intelligent control plane that monitors your services, detects incidents, analyzes them with LLMs, and **autonomously takes remediation actions** — restart pods, scale deployments, rollback, and notify your team — all without human intervention.

---

## ✨ Features

| Feature | Description |
|---|---|
| 📊 **Real-time Monitoring** | Prometheus + Grafana dashboards for all your services |
| 🚨 **Incident Management** | Auto-detect, create, and track incidents with severity levels |
| 🤖 **AI Analysis** | Analyze logs, incidents, and deployments with Groq/Llama 3.1 |
| ⚡ **Autonomous Remediation** | AI agent auto-heals — restarts pods, scales deployments, rollbacks |
| 📋 **Log Aggregation** | Centralized log collection with AI-powered root cause analysis |
| 🔄 **Deployment Management** | Track, restart, scale, and rollback Kubernetes deployments |
| 🔐 **Auth & RBAC** | JWT-based authentication with role-based access control |
| 🖥️ **Modern Dashboard** | React + shadcn/ui frontend with real-time updates |
| 🛠️ **CLI Tool** | Terminal-based interface via `devops-cli` |

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    React Frontend                       │
│              (Vite + Tailwind + shadcn/ui)              │
└────────────────┬──────────────────┬─────────────────────┘
                 │                  │
    ┌────────────▼───────┐  ┌──────▼──────────────┐
    │  Node.js Backend   │  │  Python Backend      │
    │  (Express + Prisma)│  │  (FastAPI + Groq AI) │
    │                    │  │                      │
    │  • Auth / RBAC     │  │  • AI Analyzer       │
    │  • Incidents CRUD  │  │  • Autonomous Agent  │
    │  • Deployments     │  │  • Data Fetcher      │
    │  • Logs            │  │                      │
    │  • K8s Actions     │  │                      │
    └──┬───┬───┬─────────┘  └──┬───┬───────────────┘
       │   │   │               │   │
  ┌────▼┐ ┌▼───▼┐ ┌───────────▼┐ ┌▼───────────────┐
  │Postgres│Redis│ │   Kafka    │ │  Kubernetes API │
  │  (DB) │(Cache│ │  (Events)  │ │  (Autonomous)   │
  └──────┘└─────┘ └────────────┘ └─────────────────┘
                        │
              ┌─────────▼─────────┐
              │    Prometheus +   │
              │     Grafana +     │
              │   Alertmanager    │
              └───────────────────┘
```

### How the Autonomous Agent Works

```
Alertmanager fires alert
        │
        ▼
  Kafka topic: "incident-alerts"
        │
        ▼
  Python Autonomous Agent
  (consumes from Kafka, fetches context, calls Groq LLM)
        │
        ▼
  LLM returns structured JSON action
  { "action_type": "restart_pod", "payload": {...} }
        │
        ▼
  Kafka topic: "ai-actions"
        │
        ▼
  Node.js Action Executor
  (consumes action, executes K8s API call)
        │
        ▼
  Pod restarted / Deployment scaled / Rollback executed ✅
```

---

## 📦 Quick Start

### Option A: Docker Compose (Local Development)

```bash
# 1. Clone the repository
git clone https://github.com/Piyushkp06/DEVOPS.git
cd DEVOPS

# 2. Set your Groq API key (get one free at https://console.groq.com)
echo "GROQ_API_KEY=gsk_your_key_here" > .env

# 3. Start all services
docker-compose up --build

# 4. (Optional) Start monitoring stack
docker-compose -f docker-compose.monitoring.yml up -d
```

| Service | URL |
|---|---|
| Frontend Dashboard | http://localhost:3000 |
| Node.js API | http://localhost:5000 |
| Python AI API | http://localhost:8000/docs |
| Prometheus | http://localhost:9090 |
| Grafana | http://localhost:3001 (admin/admin) |

### Option B: Helm Chart (Kubernetes — Production)

```bash
# 1. Build and push Docker images to your registry
docker build -t your-registry/devops-node-backend:latest ./node_backend
docker build -t your-registry/devops-python-backend:latest ./python_backend
docker build -t your-registry/devops-frontend:latest ./frontend
docker push your-registry/devops-node-backend:latest
docker push your-registry/devops-python-backend:latest
docker push your-registry/devops-frontend:latest

# 2. Install with Helm
helm install devops ./chart \
  --set images.nodeBackend.repository=your-registry/devops-node-backend \
  --set images.pythonBackend.repository=your-registry/devops-python-backend \
  --set images.frontend.repository=your-registry/devops-frontend \
  --set ai.groqApiKey=gsk_your_key_here \
  --set secrets.jwtKey=$(openssl rand -hex 32) \
  --set secrets.accessTokenSecret=$(openssl rand -hex 32) \
  --set secrets.refreshTokenSecret=$(openssl rand -hex 32) \
  --set postgres.password=$(openssl rand -hex 16)

# 3. (Optional) Enable Ingress
helm upgrade devops ./chart \
  --set ingress.enabled=true \
  --set ingress.host=devops.yourdomain.com
```

| Service | Access |
|---|---|
| Frontend Dashboard | `http://<node-ip>:30000` |
| Prometheus | `http://<node-ip>:30090` |
| Grafana | `http://<node-ip>:30001` (admin/admin) |

---

## ⚙️ Configuration

All configuration is managed through `chart/values.yaml`:

| Parameter | Description | Default |
|---|---|---|
| `replicas.nodeBackend` | Node.js backend replicas | `1` |
| `replicas.pythonBackend` | Python backend replicas | `1` |
| `replicas.frontend` | Frontend replicas | `1` |
| `ai.groqApiKey` | Groq API key for AI analysis | `""` |
| `kafka.enabled` | Deploy Kafka/Zookeeper | `true` |
| `monitoring.enabled` | Deploy Prometheus/Grafana/Alertmanager | `true` |
| `ingress.enabled` | Create Ingress resource | `false` |
| `rbac.create` | Create ServiceAccount + RBAC | `true` |
| `postgres.storage` | PostgreSQL PVC size | `1Gi` |

See [chart/values.yaml](./chart/values.yaml) for the full list.

---

## 🔐 RBAC & Security

When deployed via Helm with `rbac.create=true`, the platform creates:

- **ServiceAccount** (`devops-platform-sa`) — identity for backend pods
- **ClusterRole** — permissions to manage deployments, read pods/events
- **ClusterRoleBinding** — binds the role to the service account

This lets the autonomous agent safely manage deployments **within the cluster** without sharing kubeconfig credentials.

---

## 🛠️ CLI Tool

```bash
# Install globally
cd tools/cli && npm link

# Usage
devops-cli incidents list
devops-cli incidents get <id>
devops-cli actions list
devops-cli auth login
```

---

## 📂 Project Structure

```
DEVOPS/
├── chart/                    # Helm chart for Kubernetes deployment
│   ├── Chart.yaml
│   ├── values.yaml
│   └── templates/
├── node_backend/             # Express.js API server
│   ├── routes/               # API route handlers
│   ├── controllers/          # Business logic
│   ├── services/             # AI action executor
│   ├── utils/                # K8s, Kafka, JWT, metrics utilities
│   ├── prisma/               # Database schema & migrations
│   └── middlewares/          # Auth, metrics middleware
├── python_backend/           # FastAPI AI service
│   └── app/
│       ├── api/              # AI analysis endpoints
│       ├── services/         # Analyzer, autonomous agent, data fetcher
│       ├── models/           # Pydantic schemas
│       └── utils/            # Kafka client, prompts, metrics
├── frontend/                 # React + Vite + shadcn/ui dashboard
│   └── src/
│       ├── pages/            # Dashboard, Incidents, Deployments, AI, etc.
│       ├── components/       # Reusable UI components
│       └── services/         # API client
├── k8s/                      # Raw Kubernetes manifests (legacy)
├── monitoring/               # Prometheus & Grafana config
├── tools/cli/                # DevOps CLI tool
├── docker-compose.yml        # Local development stack
└── docker-compose.monitoring.yml
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the ISC License.
