# Compliance Contract: Platform and IT Infrastructure

**Project**: [PROJECT_NAME]
**Generation Date**: [GENERATION_DATE]
**Source**: ARCHITECTURE.md (Sections 4, 8, 10, 11)
**Version**: 1.0

---

## Document Control

| Field | Value |
|-------|-------|
| **Document Owner** | [INFRASTRUCTURE_ARCHITECT or N/A] |
| **Last Review Date** | [GENERATION_DATE] |
| **Next Review Date** | [NEXT_REVIEW_DATE] |
| **Status** | Draft/In Review/Approved |
| **Approval Authority** | Infrastructure Architecture Team |

---

## Compliance Summary

| Code | Requirement | Status | Source Section | Responsible Role |
|------|-------------|--------|----------------|------------------|
| LAPI01 | Unique Production Environments | [STATUS] | Section 4, 11 | Infrastructure Architect |
| LAPI02 | Server Operating Systems | [STATUS] | Section 8 | Platform Engineer |
| LAPI03 | Database Storage Capacity | [STATUS] | Section 8, 10 | Database Administrator |
| LAPI04 | Database Version Authorization | [STATUS] | Section 8 | Database Administrator |
| LAPI05 | Database Backup and Retention | [STATUS] | Section 11 | Database Administrator |
| LAPI06 | Infrastructure Capacity | [STATUS] | Section 8, 10 | Infrastructure Architect |
| LAPI07 | Naming Conventions | [STATUS] | Section 8, 11 | Infrastructure Architect |
| LAPI08 | Transaction Volume Dimensioning | [STATUS] | Section 10 | Integration Architect |
| LAPI09 | Legacy Platform Transaction Capacity | [STATUS] | Section 7, 10 | Integration Architect |

**Overall Compliance**: [X/9 Compliant, Y/9 Non-Compliant, Z/9 Not Applicable, W/9 Unknown]

**Completeness**: [COMPLETENESS_PERCENTAGE]% ([COMPLETED_ITEMS]/[TOTAL_ITEMS] data points documented)

---

## 1. Unique Production Environments (LAPI01)

**Requirement**: Validate unique production environment consistency and avoid environment crossing. Production must be isolated from non-production environments to prevent unauthorized access, data leakage, and configuration errors.

**Status**: [Compliant/Non-Compliant/Not Applicable/Unknown]
**Responsible Role**: [Infrastructure Architect / Cloud Architect or N/A]

### 1.1 Environment Isolation

**Environment Configuration**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Environment isolation clearly documented with separation mechanisms including infrastructure, network, and access controls. If Non-Compliant: Production environment not adequately isolated or mixed with other environments. If Not Applicable: Single environment deployment. If Unknown: Environment mentioned but isolation mechanisms unclear]
- Source: [ARCHITECTURE.md Section 11 (Operational Considerations → Deployment → Environments) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document production environment isolation using network segmentation (VNets/VPCs), IAM policies with least privilege, and separate infrastructure resources in Section 11. Include environment naming conventions and access control policies]

**Network Segmentation**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Network isolation documented with VNet/VPC segregation, subnet separation, and security groups. If Non-Compliant: Network isolation not specified or production shares network resources with non-production. If Not Applicable: N/A. If Unknown: Network mentioned but segregation details unclear]
- Source: [ARCHITECTURE.md Section 9 (Security Architecture → Network Security) or Section 4 (Meta Architecture) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Define network isolation using separate VNets/VPCs, dedicated subnets, Network Security Groups (NSGs), and firewall rules for production. Document peering/connectivity restrictions between environments]

**Access Controls**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Production access controls documented with RBAC, separate admin accounts, MFA requirements, and audit logging. If Non-Compliant: Access controls not defined or production uses same credentials as non-production. If Not Applicable: N/A. If Unknown: Access mentioned but control mechanisms unclear]
- Source: [ARCHITECTURE.md Section 9 (Security Architecture → Authentication & Authorization) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document production access using RBAC with least privilege, separate administrative accounts for production, mandatory MFA, and just-in-time (JIT) access policies. Include audit logging for all production access]

### 1.2 Environment Count

**Number of Production Environments**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Single production environment documented (best practice for consistency). If Non-Compliant: Multiple production environments exist creating risk of environment crossing and data inconsistency. If Not Applicable: N/A. If Unknown: Production setup unclear or environment count not specified]
- Source: [ARCHITECTURE.md Section 11 (Operational Considerations → Deployment → Environments) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Best practice is single production environment. If business requires multiple production environments (e.g., regional deployments), document clear segregation, naming conventions, and data flow controls between them]

### 1.3 Cross-Environment Data Flow

**Data Flow Restrictions**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Data flow restrictions between environments documented, including policies that production data must not flow to non-production and non-production cannot write to production. If Non-Compliant: No restrictions on cross-environment data flow or production data accessible from non-production. If Not Applicable: Single environment. If Unknown: Data flow mentioned but restrictions unclear]
- Source: [ARCHITECTURE.md Section 6 (Data Flow Patterns) or Section 11 (Operational Considerations) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Define data flow policies: production data must not flow to non-production environments, use anonymized/masked data in non-production, implement one-way data sync from production to non-production if required. Document approval process for exceptions]

**Source References**: [Consolidated list of all ARCHITECTURE.md sections used for LAPI01, e.g., "Section 4, lines X-Y; Section 9, lines A-B; Section 11, lines M-N"]

---

## 2. Server Operating Systems (LAPI02)

**Requirement**: Ensure deployment on servers with authorized Operating Systems. All server infrastructure must use OS platforms and versions approved by the organization's security and compliance standards.

**Status**: [Compliant/Non-Compliant/Not Applicable/Unknown]
**Responsible Role**: [Platform Engineer / Infrastructure Architect or N/A]

### 2.1 Operating System Platforms

**OS Platform and Version**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Operating system platforms and versions clearly documented (e.g., Ubuntu 22.04 LTS, Windows Server 2022, RHEL 9). If Non-Compliant: OS platform not specified or using deprecated/unsupported OS versions. If Not Applicable: Serverless/managed platform (e.g., Azure App Service, AWS Lambda). If Unknown: Infrastructure mentioned but OS details unclear]
- Source: [ARCHITECTURE.md Section 8 (Technology Stack → Infrastructure) or Section 4 (Meta Architecture) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document specific OS platform and version for all server infrastructure in Section 8. For Kubernetes: document node OS (e.g., Azure Linux, Ubuntu). For VMs: document OS image and version. Include patching strategy and lifecycle policy]

**Container Base Images** (if applicable): [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Container base images documented with specific versions (e.g., mcr.microsoft.com/dotnet/aspnet:8.0). If Non-Compliant: Container images not specified or using unofficial/unsupported base images. If Not Applicable: No containerization. If Unknown: Containers mentioned but base images unclear]
- Source: [ARCHITECTURE.md Section 8 (Technology Stack → Containerization) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document approved container base images in Section 8. Use official images from trusted registries (Microsoft Container Registry, Docker Official Images). Specify image digest/tag pinning strategy for reproducibility]

### 2.2 OS Version Authorization

**Authorization Status**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: OS versions verified against organizational approved OS list and documented. If Non-Compliant: OS version not on approved list or approval status unknown. If Not Applicable: Fully managed platform (no OS control). If Unknown: OS version documented but authorization status unclear]
- Source: [ARCHITECTURE.md Section 8 (Technology Stack → Infrastructure) compared against organizational OS approval list or "Not documented"]
- Note: [If Non-Compliant or Unknown: Verify OS version against organizational security standards and approved OS catalog. Document approval date and policy version. For cloud platforms: ensure OS is supported by cloud provider and receives security patches. Include OS end-of-life (EOL) tracking]

**OS Patching Strategy**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: OS patching strategy documented with update frequency, testing procedures, and maintenance windows. If Non-Compliant: No patching strategy documented. If Not Applicable: Fully managed OS (cloud provider handles patching). If Unknown: Patching mentioned but strategy unclear]
- Source: [ARCHITECTURE.md Section 11 (Operational Considerations → Maintenance) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document OS patching strategy in Section 11: update frequency (e.g., monthly security patches, quarterly feature updates), testing process, rollback procedures, and maintenance windows. For Kubernetes: document node pool update strategy]

**Source References**: [Consolidated list of all ARCHITECTURE.md sections used for LAPI02]

---

## 3. Database Storage Capacity (LAPI03)

**Requirement**: Ensure required database storage capacity and availability. Database infrastructure must provide sufficient storage for current and projected data volumes with appropriate availability and scalability configurations.

**Status**: [Compliant/Non-Compliant/Not Applicable/Unknown]
**Responsible Role**: [Database Administrator / Cloud Architect or N/A]

### 3.1 Database Capacity Configuration

**Database Type and Size**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Database platform, storage capacity, and tier/SKU documented (e.g., Azure SQL Database, 250 GB storage, General Purpose tier). If Non-Compliant: Database storage capacity not specified or insufficient for documented data volume. If Not Applicable: No persistent database (stateless architecture). If Unknown: Database mentioned but capacity details unclear]
- Source: [ARCHITECTURE.md Section 8 (Technology Stack → Databases) or Section 10 (Scalability & Performance → Capacity Planning) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document database storage capacity in Section 8 or Section 10: current allocated storage, current usage, storage growth rate, and projected capacity requirements. Include storage tier/SKU and IOPS/throughput specifications]

**Current vs Projected Capacity**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Current storage usage and projected growth documented with capacity planning horizon (e.g., current 60 GB, projected 150 GB in 12 months). If Non-Compliant: Projected capacity not documented or current usage approaching capacity limits. If Not Applicable: N/A. If Unknown: Storage mentioned but growth projections unclear]
- Source: [ARCHITECTURE.md Section 10 (Scalability & Performance → Capacity Planning) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document capacity planning in Section 10: current database size, growth rate (GB/month), projected size at 6/12/24 months, and capacity headroom thresholds (e.g., maintain 30% free space). Include monitoring and alerting for capacity thresholds]

### 3.2 Storage Scalability

**Scaling Configuration**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Storage scaling strategy documented (auto-scaling, manual scaling, elastic pools) with scaling limits. If Non-Compliant: Scaling mechanism not specified or no scaling capability. If Not Applicable: N/A. If Unknown: Scaling mentioned but configuration unclear]
- Source: [ARCHITECTURE.md Section 10 (Scalability & Performance → Database Scaling) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document storage scaling strategy in Section 10: auto-scaling configuration (if available), manual scaling procedures, maximum storage limits, and scaling trigger thresholds. For cloud databases: specify tier/SKU upgrade path]

**Storage Performance (IOPS/Throughput)**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Storage IOPS and throughput requirements documented and matched to tier/SKU. If Non-Compliant: IOPS/throughput not specified or insufficient for workload. If Not Applicable: N/A. If Unknown: Performance mentioned but IOPS/throughput unclear]
- Source: [ARCHITECTURE.md Section 10 (Performance Targets) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document storage performance requirements in Section 10: required IOPS, throughput (MB/s), latency targets, and verify tier/SKU provides sufficient performance. Include performance testing results]

### 3.3 Availability Configuration

**High Availability Setup**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Database availability configuration documented (replicas, zones, geo-redundancy, SLA). If Non-Compliant: Availability configuration not specified or insufficient for RTO/RPO targets. If Not Applicable: Non-critical database (no HA requirement). If Unknown: Availability mentioned but configuration unclear]
- Source: [ARCHITECTURE.md Section 11 (Operational Considerations → High Availability) or Section 8 (Technology Stack → Databases) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document HA configuration in Section 8 or 11: read replicas, availability zones, geo-replication, automatic failover configuration, and target SLA. Verify configuration meets RTO/RPO requirements. For cloud: specify availability zone configuration and failover policies]

**Source References**: [Consolidated list of all ARCHITECTURE.md sections used for LAPI03]

---

## 4. Database Version Authorization (LAPI04)

**Requirement**: Ensure storage components use authorized databases for On-Premise components. All database platforms and versions must be approved by organizational standards and security policies.

**Status**: [Compliant/Non-Compliant/Not Applicable/Unknown]
**Responsible Role**: [Database Administrator / Compliance Officer or N/A]

### 4.1 Database Platform and Version

**Database Platform**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Database platform and version clearly documented (e.g., SQL Server 2022, PostgreSQL 15, MongoDB 7.0). If Non-Compliant: Database version not specified or using deprecated/unsupported version. If Not Applicable: No database component. If Unknown: Database mentioned but version unclear]
- Source: [ARCHITECTURE.md Section 8 (Technology Stack → Databases) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document specific database platform and version in Section 8. Include patch level for critical databases (e.g., SQL Server 2022 CU5). Verify version is supported by vendor and receives security updates]

**On-Premise vs Cloud Managed**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Deployment model clearly documented (On-Premise, Cloud Managed, Hybrid). If Non-Compliant: Deployment model not specified. If Not Applicable: N/A. If Unknown: Database mentioned but deployment model unclear]
- Source: [ARCHITECTURE.md Section 4 (Meta Architecture) or Section 8 (Technology Stack → Databases) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document deployment model in Section 4 or 8. For On-Premise: LAPI04 applies to authorization requirements. For Cloud Managed (Azure SQL, RDS): note that cloud provider manages versions, but architecture should document which managed service version is used]

### 4.2 Authorization Status

**Approval Against Authorized List**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Database version verified against organizational approved database catalog and documented. If Non-Compliant: Database version not on approved list or approval status unknown. If Not Applicable: Cloud managed database (authorization delegated to cloud provider's supported versions). If Unknown: Database version documented but authorization status unclear]
- Source: [ARCHITECTURE.md Section 8 (Technology Stack → Databases) compared against organizational database approval catalog or "Not documented"]
- Note: [If Non-Compliant or Unknown: Verify database version against organizational standards and approved database catalog. Document approval date, policy version, and any exceptions granted. For On-Premise databases: ensure version meets security requirements and has active vendor support. Include database end-of-life (EOL) tracking and upgrade plan for approaching EOL versions]

**Vendor Support Status**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Database version confirmed to be in active vendor support with documented EOL date. If Non-Compliant: Database version is EOL or approaching EOL without upgrade plan. If Not Applicable: N/A. If Unknown: Support status unclear]
- Source: [ARCHITECTURE.md Section 8 (Technology Stack → Databases) or vendor support documentation or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document vendor support status in Section 8: current support tier (mainstream, extended), EOL date, and upgrade plan if approaching EOL. For cloud managed databases: verify managed service version is within cloud provider's supported lifecycle]

**Source References**: [Consolidated list of all ARCHITECTURE.md sections used for LAPI04]

---

## 5. Database Backup and Retention (LAPI05)

**Requirement**: Reflect retention and backup policies for On-Premise databases and design backup environment capacity. Database backup strategy must ensure data protection, meet recovery objectives (RTO/RPO), and comply with retention policies.

**Status**: [Compliant/Non-Compliant/Not Applicable/Unknown]
**Responsible Role**: [Database Administrator / Business Continuity Manager or N/A]

### 5.1 Backup Strategy

**Backup Method**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Backup method documented (full, incremental, differential, continuous, snapshot) with frequency. If Non-Compliant: Backup method not specified or backups not implemented. If Not Applicable: Stateless database or cloud-managed automatic backups. If Unknown: Backups mentioned but method unclear]
- Source: [ARCHITECTURE.md Section 11 (Operational Considerations → Backup & Disaster Recovery) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document backup strategy in Section 11: backup method (full/incremental/differential), backup frequency (daily, hourly, continuous), backup windows, and backup technology/tools. For cloud databases: document whether using cloud-native backup (e.g., Azure SQL automated backups) or custom backup solution]

**Backup Frequency**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Backup frequency documented and aligned with RPO requirements (e.g., full daily, transaction log every 15 minutes). If Non-Compliant: Backup frequency not specified or insufficient for RPO targets. If Not Applicable: N/A. If Unknown: Backups mentioned but frequency unclear]
- Source: [ARCHITECTURE.md Section 11 (Operational Considerations → Backup & Disaster Recovery) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document backup frequency in Section 11 aligned with RPO: full backups (daily/weekly), differential/incremental backups (hourly/daily), transaction log backups (15-60 minutes for minimal data loss). Verify backup frequency supports documented RPO]

### 5.2 Retention Policies

**Retention Period**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Backup retention periods documented (short-term and long-term) with compliance justification. If Non-Compliant: Retention periods not specified or don't meet compliance requirements. If Not Applicable: N/A. If Unknown: Retention mentioned but periods unclear]
- Source: [ARCHITECTURE.md Section 11 (Operational Considerations → Backup & Disaster Recovery) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document retention policies in Section 11: short-term retention (7-35 days for operational recovery), long-term retention (1-7 years for compliance), and archival requirements. Include retention policy rationale (regulatory compliance, business requirements). For cloud: specify point-in-time restore window]

**Retention Tiers**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Multi-tier retention documented (operational backups, compliance archives, geo-redundant copies). If Non-Compliant: Retention tiers not specified. If Not Applicable: Single retention tier sufficient. If Unknown: Retention mentioned but tier structure unclear]
- Source: [ARCHITECTURE.md Section 11 (Operational Considerations → Backup & Disaster Recovery) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document retention tier strategy in Section 11: operational tier (hot storage, frequent access), compliance tier (warm/cold storage, infrequent access), and archival tier (cold storage, rare access). Include transition policies between tiers]

### 5.3 Backup Storage Capacity

**Backup Storage Requirements**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Backup storage capacity calculated and documented based on database size, retention period, and change rate. If Non-Compliant: Backup storage capacity not specified or insufficient. If Not Applicable: Cloud-managed backup (provider handles capacity). If Unknown: Backup storage mentioned but capacity unclear]
- Source: [ARCHITECTURE.md Section 11 (Operational Considerations → Backup & Disaster Recovery) or Section 10 (Capacity Planning) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document backup storage capacity in Section 11: calculation method (e.g., database size × retention days × change rate), current backup storage usage, projected growth, and storage location (on-premise SAN, cloud blob storage). Include monitoring for backup storage capacity]

**Geo-Redundant Backup Storage**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Geo-redundant backup storage documented with replication to secondary region/site. If Non-Compliant: Backups not geo-redundant or replication not configured. If Not Applicable: No geo-redundancy requirement. If Unknown: Backup replication mentioned but configuration unclear]
- Source: [ARCHITECTURE.md Section 11 (Operational Considerations → Disaster Recovery) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document geo-redundant backup strategy in Section 11: secondary backup location (region/datacenter), replication method (async/sync), replication frequency, and verification process. For cloud: specify geo-redundant storage (GRS) configuration]

### 5.4 Recovery Procedures (RTO/RPO)

**Recovery Time Objective (RTO)**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: RTO documented and validated with backup solution capabilities (e.g., RTO: 4 hours). If Non-Compliant: RTO not specified or backup solution cannot meet RTO. If Not Applicable: No RTO requirement. If Unknown: RTO mentioned but not validated against backup capabilities]
- Source: [ARCHITECTURE.md Section 11 (Operational Considerations → Disaster Recovery) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document RTO target in Section 11 and validate backup solution can achieve it: restore time for full database, restore time for point-in-time recovery, and failover time for geo-replicas. Include RTO validation through DR testing]

**Recovery Point Objective (RPO)**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: RPO documented and validated with backup frequency (e.g., RPO: 15 minutes). If Non-Compliant: RPO not specified or backup frequency insufficient for RPO. If Not Applicable: No RPO requirement. If Unknown: RPO mentioned but not validated against backup frequency]
- Source: [ARCHITECTURE.md Section 11 (Operational Considerations → Disaster Recovery) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document RPO target in Section 11 and validate backup frequency achieves it: transaction log backup frequency, continuous backup capabilities, and maximum acceptable data loss. Include RPO validation through recovery testing]

**Backup Testing**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Backup restoration testing documented with frequency and procedures (e.g., monthly restore tests, quarterly DR drills). If Non-Compliant: Backup testing not documented or not performed regularly. If Not Applicable: N/A. If Unknown: Testing mentioned but procedures unclear]
- Source: [ARCHITECTURE.md Section 11 (Operational Considerations → Disaster Recovery) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document backup testing procedures in Section 11: restore test frequency (monthly recommended), test environment, validation criteria, and test result documentation. Include DR drill schedule (quarterly/annual) and lessons learned process]

**Source References**: [Consolidated list of all ARCHITECTURE.md sections used for LAPI05]

---

## 6. Infrastructure Capacity (LAPI06)

**Requirement**: Ensure infrastructure resource capacity matches component requirements. Infrastructure must provide sufficient compute, memory, network, and storage resources for current and projected workloads with appropriate headroom.

**Status**: [Compliant/Non-Compliant/Not Applicable/Unknown]
**Responsible Role**: [Infrastructure Architect / Capacity Planner or N/A]

### 6.1 Compute Capacity

**Compute Resources (CPU/Memory)**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Compute capacity documented with CPU cores, memory, and current utilization (e.g., 16 vCPUs, 64 GB RAM, 60% average utilization). If Non-Compliant: Compute capacity not specified or insufficient for documented workload. If Not Applicable: Serverless (auto-scaling compute). If Unknown: Infrastructure mentioned but compute capacity unclear]
- Source: [ARCHITECTURE.md Section 8 (Technology Stack → Infrastructure) or Section 10 (Scalability & Performance → Capacity Planning) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document compute capacity in Section 8 or 10: vCPU count, memory (GB), current utilization (average and peak), and capacity headroom. For Kubernetes: document node pool sizes, pod resource requests/limits. Include compute SKU/VM size]

**Current vs Peak Utilization**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Current and peak utilization documented with capacity headroom analysis (e.g., average 60%, peak 85%, 15% headroom). If Non-Compliant: Utilization not documented or consistently exceeding 90% (insufficient headroom). If Not Applicable: N/A. If Unknown: Utilization mentioned but metrics unclear]
- Source: [ARCHITECTURE.md Section 10 (Scalability & Performance → Capacity Planning) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document capacity utilization in Section 10: average utilization, peak utilization, capacity headroom (recommended 20-30% headroom for burst capacity), and monitoring thresholds. Include historical utilization trends and projected growth]

### 6.2 Scaling Configuration

**Horizontal Scaling**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Horizontal scaling configuration documented (auto-scaling rules, min/max instances, scaling metrics). If Non-Compliant: Horizontal scaling not configured or limits insufficient. If Not Applicable: Fixed capacity (no horizontal scaling). If Unknown: Scaling mentioned but configuration unclear]
- Source: [ARCHITECTURE.md Section 10 (Scalability & Performance → Horizontal Scaling) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document horizontal scaling in Section 10: auto-scaling configuration (CPU/memory thresholds), minimum and maximum instance counts, scaling cooldown periods, and scaling metrics. For Kubernetes: HPA configuration. For cloud VMs: VMSS/ASG configuration]

**Vertical Scaling**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Vertical scaling capabilities documented (VM/node size upgrade path, downtime requirements). If Non-Compliant: Vertical scaling not documented or not possible. If Not Applicable: N/A. If Unknown: Scaling mentioned but vertical capabilities unclear]
- Source: [ARCHITECTURE.md Section 10 (Scalability & Performance → Vertical Scaling) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document vertical scaling in Section 10: available SKU/size tiers, upgrade/downgrade procedures, downtime impact, and maximum vertical scale limits. Include when to use vertical vs horizontal scaling]

### 6.3 Capacity Headroom

**Capacity Headroom Analysis**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Capacity headroom documented and meets recommended thresholds (20-30% headroom for production). If Non-Compliant: Insufficient headroom (< 10%) or headroom not analyzed. If Not Applicable: N/A. If Unknown: Capacity mentioned but headroom unclear]
- Source: [ARCHITECTURE.md Section 10 (Scalability & Performance → Capacity Planning) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document capacity headroom in Section 10: calculate headroom as (Total Capacity - Peak Usage) / Total Capacity. Maintain 20-30% headroom for production to handle burst traffic and scaling delays. Include capacity planning horizon (6-12 months) and growth projections]

**Network Capacity**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Network capacity documented (bandwidth, latency, throughput requirements). If Non-Compliant: Network capacity not specified or insufficient for workload. If Not Applicable: N/A. If Unknown: Network mentioned but capacity unclear]
- Source: [ARCHITECTURE.md Section 8 (Technology Stack → Infrastructure) or Section 10 (Performance Targets) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document network capacity in Section 8 or 10: network bandwidth (Gbps), expected throughput (Mbps), latency requirements, and network SKU/tier. For cloud: document ExpressRoute/VPN capacity. Include inter-service communication bandwidth requirements]

**Storage Capacity** (Infrastructure Storage): [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Infrastructure storage capacity documented (ephemeral storage, persistent volumes, current usage). If Non-Compliant: Storage capacity not specified or insufficient. If Not Applicable: Stateless infrastructure (no storage). If Unknown: Storage mentioned but capacity unclear]
- Source: [ARCHITECTURE.md Section 8 (Technology Stack → Infrastructure) or Section 10 (Capacity Planning) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document infrastructure storage capacity in Section 8 or 10: persistent volume sizes, ephemeral storage per node, storage class/tier, and IOPS requirements. For Kubernetes: document PV/PVC capacity. Separate from database storage (covered in LAPI03)]

**Source References**: [Consolidated list of all ARCHITECTURE.md sections used for LAPI06]

---

## 7. Naming Conventions (LAPI07)

**Requirement**: Ensure On-Premise infrastructure architecture adheres to naming standards. All infrastructure resources must follow organizational naming conventions for consistency, traceability, and operational efficiency.

**Status**: [Compliant/Non-Compliant/Not Applicable/Unknown]
**Responsible Role**: [Infrastructure Architect / Standards Officer or N/A]

### 7.1 Infrastructure Naming Standards

**Naming Convention Documentation**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Infrastructure naming conventions documented with pattern, examples, and organizational standard reference. If Non-Compliant: Naming conventions not documented or not following organizational standards. If Not Applicable: N/A. If Unknown: Naming mentioned but conventions unclear]
- Source: [ARCHITECTURE.md Section 8 (Technology Stack → Infrastructure) or Section 11 (Operational Considerations) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document naming conventions in Section 8 or 11: naming pattern (e.g., {environment}-{application}-{resource-type}-{region}), examples (prod-taskscheduler-aks-eastus), and reference to organizational naming standard. Include naming for: clusters, nodes, VMs, databases, storage accounts, networks, subnets, security groups]

**Resource Naming Examples**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Concrete naming examples provided for key infrastructure resources. If Non-Compliant: No naming examples or examples don't follow documented pattern. If Not Applicable: N/A. If Unknown: Resources mentioned but naming examples unclear]
- Source: [ARCHITECTURE.md Section 8 (Technology Stack → Infrastructure) or Section 4 (Meta Architecture) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document resource naming examples in Section 8: Kubernetes cluster name, node pool names, database server names, storage account names, VNet/subnet names. Ensure examples follow organizational naming standard and include environment prefix (dev/staging/prod)]

### 7.2 Compliance with Organizational Standards

**Standards Compliance Verification**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Infrastructure naming verified against organizational standards with standard version documented. If Non-Compliant: Naming does not comply with organizational standards or verification not performed. If Not Applicable: No organizational naming standard. If Unknown: Standards mentioned but compliance verification unclear]
- Source: [ARCHITECTURE.md Section 8 (Technology Stack → Infrastructure) compared against organizational naming standard or "Not documented"]
- Note: [If Non-Compliant or Unknown: Verify infrastructure naming against organizational naming standard (reference standard name and version). Document compliance status, any approved exceptions, and remediation plan for non-compliant names. Include tag/label naming conventions (cost center, owner, environment, project)]

**Tagging and Labeling**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Resource tagging/labeling strategy documented with required tags and values. If Non-Compliant: Tagging strategy not documented or required tags missing. If Not Applicable: N/A. If Unknown: Tags mentioned but strategy unclear]
- Source: [ARCHITECTURE.md Section 8 (Technology Stack → Infrastructure) or Section 11 (Operational Considerations) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document tagging/labeling strategy in Section 8 or 11: required tags (Environment, Owner, CostCenter, Project, Application), tag format, and tag governance policy. For Kubernetes: document pod labels and namespace labels. For cloud: document Azure tags / AWS tags requirements]

**Source References**: [Consolidated list of all ARCHITECTURE.md sections used for LAPI07]

---

## 8. Transaction Volume Dimensioning (LAPI08)

**Requirement**: Ensure On-Premise integration components are designed with production transaction volumes and sizes. Integration infrastructure must be dimensioned to handle documented transaction rates (TPS) and message sizes for current and projected workloads.

**Status**: [Compliant/Non-Compliant/Not Applicable/Unknown]
**Responsible Role**: [Integration Architect / Performance Engineer or N/A]

### 8.1 Transaction Volume Configuration

**Target Transaction Rate (TPS)**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Target transaction rate documented with sustained and peak TPS (e.g., 180 TPS sustained, 300 TPS peak). If Non-Compliant: Transaction rate not specified or integration components not dimensioned for documented TPS. If Not Applicable: No integration components or non-transactional architecture. If Unknown: Transaction rate mentioned but values unclear]
- Source: [ARCHITECTURE.md Section 10 (Scalability & Performance → Performance Targets → Throughput) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document transaction rate targets in Section 10: sustained TPS (average load), peak TPS (expected burst), and system limit TPS (maximum capacity). Include separate TPS for different transaction types (create, read, update, delete) and integration patterns (sync/async)]

**System Capacity Limits**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: System capacity limits documented with maximum TPS and capacity headroom. If Non-Compliant: Capacity limits not documented or insufficient headroom. If Not Applicable: N/A. If Unknown: Limits mentioned but capacity unclear]
- Source: [ARCHITECTURE.md Section 10 (Scalability & Performance → Capacity Planning) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document system capacity limits in Section 10: maximum TPS capacity, capacity headroom calculation (e.g., peak 300 TPS with 1000 TPS limit = 70% headroom), and scaling trigger thresholds. Include load testing results validating capacity limits]

### 8.2 Transaction Size Requirements

**Message/Payload Sizes**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Transaction payload sizes documented with average and maximum message sizes. If Non-Compliant: Payload sizes not specified or integration not dimensioned for documented sizes. If Not Applicable: N/A. If Unknown: Message sizes mentioned but values unclear]
- Source: [ARCHITECTURE.md Section 10 (Scalability & Performance → Performance Targets) or Section 7 (Integration Points) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document message/payload sizes in Section 7 or 10: average message size (KB), maximum message size (MB), and size distribution (e.g., 90% < 10 KB, 10% < 1 MB). Include message size limits and handling strategy for oversized messages]

**Throughput Requirements (MB/s)**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Data throughput calculated from TPS and message sizes (e.g., 180 TPS × 5 KB = 900 KB/s). If Non-Compliant: Throughput not calculated or infrastructure bandwidth insufficient. If Not Applicable: N/A. If Unknown: Throughput mentioned but calculation unclear]
- Source: [ARCHITECTURE.md Section 10 (Scalability & Performance → Performance Targets) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document throughput requirements in Section 10: calculate throughput as TPS × average message size, include peak throughput, and verify network/infrastructure bandwidth supports throughput. Include compression/batching strategies if applicable]

### 8.3 Integration Component Capacity

**Integration Middleware Capacity**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Integration middleware (message queue, API gateway, ESB) capacity documented and matched to TPS requirements. If Non-Compliant: Middleware capacity not specified or insufficient for documented TPS. If Not Applicable: No middleware (direct integration). If Unknown: Middleware mentioned but capacity unclear]
- Source: [ARCHITECTURE.md Section 7 (Integration Points) or Section 8 (Technology Stack → Integration) or Section 10 (Performance) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document integration middleware capacity in Section 7 or 8: message queue capacity (messages/sec, queue depth), API gateway rate limits (requests/sec), connection pool sizes. Verify middleware capacity supports documented TPS with headroom. Include middleware SKU/tier and scaling configuration]

**Connection and Concurrency Limits**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Connection limits and concurrency configuration documented (connection pool size, max concurrent requests). If Non-Compliant: Connection limits not specified or insufficient for TPS requirements. If Not Applicable: N/A. If Unknown: Connections mentioned but limits unclear]
- Source: [ARCHITECTURE.md Section 8 (Technology Stack → Integration) or Section 10 (Performance) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document connection and concurrency limits in Section 8 or 10: database connection pool size, HTTP client connection limits, max concurrent requests/threads, and timeout configurations. Calculate required concurrency as: TPS × average response time (e.g., 180 TPS × 100ms = 18 concurrent requests minimum)]

**Source References**: [Consolidated list of all ARCHITECTURE.md sections used for LAPI08]

---

## 9. Legacy Platform Transaction Capacity (LAPI09)

**Requirement**: Ensure listening port capacity for legacy components matches estimated transaction numbers. Legacy system integration points must be properly dimensioned with adequate port configuration, connection limits, and transaction capacity.

**Status**: [Compliant/Non-Compliant/Not Applicable/Unknown]
**Responsible Role**: [Integration Architect / Legacy Systems Specialist or N/A]

### 9.1 Listening Port Configuration

**Port Configuration**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Listening ports documented for legacy system interfaces (port numbers, protocols, purpose). If Non-Compliant: Port configuration not documented or ports not properly configured. If Not Applicable: No legacy system integration. If Unknown: Ports mentioned but configuration unclear]
- Source: [ARCHITECTURE.md Section 7 (Integration Points → External Systems) or Section 9 (Security Architecture → Network Security) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document listening port configuration in Section 7: port numbers, protocols (TCP/UDP/HTTP/HTTPS), firewall rules, and port purpose (e.g., port 8080 for legacy SOAP API, port 1433 for legacy SQL Server). Include network security group (NSG) or firewall configuration allowing traffic to/from legacy systems]

**Protocol and Interface Type**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Integration protocol and interface type documented (REST, SOAP, TCP, MQ, FTP). If Non-Compliant: Protocol not specified or interface unclear. If Not Applicable: No legacy integration. If Unknown: Integration mentioned but protocol unclear]
- Source: [ARCHITECTURE.md Section 7 (Integration Points → External Systems) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document integration protocol in Section 7: protocol type (REST API, SOAP web service, TCP socket, message queue, file transfer), interface specification (WSDL, OpenAPI, custom protocol), and legacy system endpoint details]

### 9.2 Connection Limits

**Maximum Concurrent Connections**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Connection limits documented for legacy system ports (max concurrent connections, connection pooling). If Non-Compliant: Connection limits not specified or insufficient for transaction volume. If Not Applicable: No connection-based legacy integration. If Unknown: Connections mentioned but limits unclear]
- Source: [ARCHITECTURE.md Section 7 (Integration Points → External Systems) or Section 10 (Performance) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document connection limits in Section 7 or 10: maximum concurrent connections supported by legacy system, connection pool configuration (min/max pool size), connection timeout settings, and connection retry logic. Verify connection limits support estimated transaction rate]

**Connection Pool Configuration**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Connection pool configuration documented (pool size, timeout, keep-alive) for legacy system connections. If Non-Compliant: Connection pooling not configured or pool size insufficient. If Not Applicable: Connectionless protocol. If Unknown: Pool mentioned but configuration unclear]
- Source: [ARCHITECTURE.md Section 8 (Technology Stack → Integration) or Section 10 (Performance) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document connection pool configuration in Section 8 or 10: minimum and maximum pool size, connection timeout (seconds), idle timeout, connection validation, and keep-alive settings. Size connection pool to support peak TPS: pool size >= (peak TPS × average response time in seconds)]

### 9.3 Transaction Capacity per Port

**Estimated Transaction Volume**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Transaction volume per legacy port documented and validated (estimated TPS, peak load). If Non-Compliant: Transaction volume not documented or port capacity insufficient. If Not Applicable: No legacy transaction processing. If Unknown: Volume mentioned but estimates unclear]
- Source: [ARCHITECTURE.md Section 10 (Scalability & Performance → Performance Targets) or Section 7 (Integration Points) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document transaction volume per legacy integration port in Section 7 or 10: estimated sustained TPS, peak TPS, transaction volume distribution (by time of day), and legacy system capacity limits. Include load testing results validating legacy system can handle estimated volume]

**Legacy System Capacity Validation**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Legacy system capacity validated through testing or documented capacity limits (TPS, response time, SLA). If Non-Compliant: Legacy capacity not validated or unknown if legacy can support load. If Not Applicable: No legacy system dependency. If Unknown: Legacy system mentioned but capacity unclear]
- Source: [ARCHITECTURE.md Section 7 (Integration Points → External Systems) or Section 10 (Performance) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document legacy system capacity validation in Section 7 or 10: legacy system's documented TPS capacity, measured response times, SLA commitments, and load testing results. Verify architecture's transaction rate does not exceed legacy system's capacity. Include backpressure/throttling mechanisms to protect legacy systems from overload]

**Failover and Redundancy**: [Value or "Not specified"]
- Status: [Compliant/Non-Compliant/Not Applicable/Unknown]
- Explanation: [If Compliant: Failover configuration documented for legacy integrations (redundant ports, load balancing, circuit breakers). If Non-Compliant: No failover mechanism or single point of failure. If Not Applicable: Legacy system has no failover requirement. If Unknown: Failover mentioned but configuration unclear]
- Source: [ARCHITECTURE.md Section 11 (Operational Considerations → High Availability) or Section 7 (Integration Points) or "Not documented"]
- Note: [If Non-Compliant or Unknown: Document failover configuration in Section 7 or 11: redundant legacy system endpoints, load balancing configuration, circuit breaker pattern implementation, and retry logic with exponential backoff. Include monitoring for legacy system availability and automatic failover triggers]

**Source References**: [Consolidated list of all ARCHITECTURE.md sections used for LAPI09]

---

## Appendix: Source Traceability

This section provides full traceability from compliance requirements to ARCHITECTURE.md source sections.

### LAPI01 - Unique Production Environments
**Primary Sources**:
- Section 4 (Meta Architecture Layers)
- Section 9 (Security Architecture → Network Security, Authentication & Authorization)
- Section 11 (Operational Considerations → Deployment → Environments)
- Section 6 (Data Flow Patterns)

### LAPI02 - Server Operating Systems
**Primary Sources**:
- Section 4 (Meta Architecture Layers)
- Section 8 (Technology Stack → Infrastructure, Containerization)
- Section 11 (Operational Considerations → Maintenance)

### LAPI03 - Database Storage Capacity
**Primary Sources**:
- Section 8 (Technology Stack → Databases)
- Section 10 (Scalability & Performance → Capacity Planning, Database Scaling, Performance Targets)
- Section 11 (Operational Considerations → High Availability)

### LAPI04 - Database Version Authorization
**Primary Sources**:
- Section 4 (Meta Architecture Layers)
- Section 8 (Technology Stack → Databases)

### LAPI05 - Database Backup and Retention
**Primary Sources**:
- Section 11 (Operational Considerations → Backup & Disaster Recovery, Disaster Recovery)
- Section 10 (Capacity Planning)

### LAPI06 - Infrastructure Capacity
**Primary Sources**:
- Section 8 (Technology Stack → Infrastructure)
- Section 10 (Scalability & Performance → Capacity Planning, Horizontal Scaling, Vertical Scaling, Performance Targets)

### LAPI07 - Naming Conventions
**Primary Sources**:
- Section 4 (Meta Architecture Layers)
- Section 8 (Technology Stack → Infrastructure)
- Section 11 (Operational Considerations)

### LAPI08 - Transaction Volume Dimensioning
**Primary Sources**:
- Section 7 (Integration Points)
- Section 8 (Technology Stack → Integration)
- Section 10 (Scalability & Performance → Performance Targets → Throughput, Capacity Planning)

### LAPI09 - Legacy Platform Transaction Capacity
**Primary Sources**:
- Section 7 (Integration Points → External Systems)
- Section 8 (Technology Stack → Integration)
- Section 9 (Security Architecture → Network Security)
- Section 10 (Scalability & Performance → Performance Targets)
- Section 11 (Operational Considerations → High Availability)

---

## Generation Metadata

**Template Version**: 1.0
**Template Created**: [CREATION_DATE]
**Template Author**: Architecture Compliance Skill
**Compliance Framework**: Platform and IT Infrastructure (LAPI)
**Total Requirements**: 9 (LAPI01-LAPI09)
**Total Data Points**: 25 subsections across 9 requirements

**Document Generation Instructions**:
1. Extract data from ARCHITECTURE.md sections 4, 8, 10, 11 primarily
2. For each subsection, evaluate: Compliant/Non-Compliant/Not Applicable/Unknown
3. Provide source line numbers for all extracted data
4. Calculate overall compliance percentage
5. Generate remediation guidance for Non-Compliant and Unknown items

**Status Criteria**:
- **Compliant**: Data fully documented in ARCHITECTURE.md and meets organizational standards
- **Non-Compliant**: Data missing, incomplete, or does not meet standards (requires remediation)
- **Not Applicable**: Requirement does not apply to this architecture
- **Unknown**: Data partially documented or unclear (requires investigation)

---

*End of Template*