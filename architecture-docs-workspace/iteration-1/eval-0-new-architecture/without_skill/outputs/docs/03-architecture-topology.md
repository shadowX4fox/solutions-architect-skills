# Section 3 — Architecture Topology

## 3.1 High-Level Architecture

```mermaid
graph TD
    subgraph Clients["Client Channels"]
        MOB[Mobile App]
        WEB[Web App]
        BP[Business Partner APIs]
    end

    subgraph Edge["Edge Layer — AWS ALB + WAF"]
        WAF[AWS WAF]
        ALB[Application Load Balancer]
        APIGW[API Gateway Service]
    end

    subgraph Core["Core Services — EKS Cluster (PCI Zone)"]
        PS[Payment Processor Service]
        TS[Tokenisation Service]
        FS[Fraud Detection Service]
        LS[Ledger Service]
        NS[Notification Service]
        RS[Reconciliation Service]
        WHS[Webhook Dispatcher Service]
        BS[Bulk Ingest Service]
    end

    subgraph Messaging["Event Streaming — Amazon MSK (Kafka)"]
        KTX[Topic: payment.events]
        KFR[Topic: fraud.events]
        KNT[Topic: notification.events]
        KLD[Topic: ledger.commands]
        KWH[Topic: webhook.dispatch]
    end

    subgraph DataStores["Data Stores"]
        ORA[(Oracle DB — Ledger)]
        RDS[(Amazon Aurora PostgreSQL — Payments)]
        DDB[(Amazon DynamoDB — Idempotency / Sessions)]
        ELC[(Amazon ElastiCache Redis — Rate Limit / Cache)]
        S3[(Amazon S3 — Bulk Files / Audit)]
    end

    subgraph Observability["Observability"]
        CW[Amazon CloudWatch]
        XRAY[AWS X-Ray]
        SEC[AWS Security Hub]
    end

    MOB --> WAF
    WEB --> WAF
    BP --> WAF
    WAF --> ALB
    ALB --> APIGW
    APIGW --> PS
    APIGW --> BS
    PS --> TS
    PS --> KTX
    FS --> KTX
    KTX --> FS
    KTX --> LS
    KTX --> NS
    KTX --> WHS
    LS --> KLD
    KLD --> LS
    LS --> ORA
    PS --> RDS
    PS --> DDB
    APIGW --> ELC
    NS --> KNT
    WHS --> KWH
    BS --> S3
    BS --> KTX
    PS --> XRAY
    LS --> XRAY
    Core --> CW
```

## 3.2 Network Zones and Segmentation

PayStream is deployed across four distinct network zones in AWS, enforced through VPC security groups and NACLs:

```mermaid
graph LR
    subgraph PublicZone["Public Zone (Internet-facing)"]
        WAF2[WAF / ALB]
    end

    subgraph DMZ["DMZ (API Gateway)"]
        APIGW2[API Gateway Service]
    end

    subgraph AppZone["Application Zone (EKS)"]
        SVC[Core Services]
    end

    subgraph PCIZone["PCI-Scoped Zone (Tokenisation)"]
        TOK[Tokenisation Service]
        HSM[AWS CloudHSM]
    end

    subgraph DataZone["Data Zone"]
        DB[All Data Stores]
    end

    PublicZone --> DMZ
    DMZ --> AppZone
    AppZone --> PCIZone
    AppZone --> DataZone
    PCIZone --> DataZone
```

| Zone | Components | Inbound Allowed From | Egress Allowed To |
|------|-----------|---------------------|------------------|
| Public | AWS WAF, ALB | Internet | DMZ only |
| DMZ | API Gateway Service | Public Zone | App Zone only |
| Application | All core microservices | DMZ | Data Zone, Messaging, PCI Zone |
| PCI-Scoped | Tokenisation Service, CloudHSM | App Zone (payment paths only) | Data Zone (token vault only) |
| Data | All data stores | App Zone, PCI Zone | None (no external egress) |

## 3.3 Multi-AZ Topology

All Tier 1 services are deployed across 3 AWS Availability Zones (`us-east-1a`, `us-east-1b`, `us-east-1c`) to meet the 99.99% availability SLO and < 5 min RTO.

```mermaid
graph TD
    subgraph AZ_A["AZ: us-east-1a"]
        PS_A[Payment Processor]
        LS_A[Ledger Service]
        MSK_A[MSK Broker 1]
    end

    subgraph AZ_B["AZ: us-east-1b"]
        PS_B[Payment Processor]
        LS_B[Ledger Service]
        MSK_B[MSK Broker 2]
    end

    subgraph AZ_C["AZ: us-east-1c"]
        PS_C[Payment Processor]
        LS_C[Ledger Service]
        MSK_C[MSK Broker 3]
    end

    ALB3[ALB] --> PS_A
    ALB3 --> PS_B
    ALB3 --> PS_C

    ORA3[(Oracle — Primary)] --- ORA3S[(Oracle — Standby)]
```

## 3.4 Deployment Model

| Layer | Technology | Deployment Unit |
|-------|-----------|----------------|
| Container orchestration | AWS EKS (Kubernetes 1.28+) | EKS Managed Node Groups, auto-scaling |
| Service mesh | AWS App Mesh | Envoy sidecar per pod |
| Container registry | Amazon ECR | Per-service image repository |
| Infrastructure-as-Code | AWS CDK (TypeScript) | Per-environment stacks |
| CI/CD | GitHub Actions + ArgoCD | GitOps; environment promotion via PR |
| Secrets | AWS Secrets Manager | Injected at pod startup via CSI driver |
| Configuration | AWS Systems Manager Parameter Store | Non-secret runtime config |
