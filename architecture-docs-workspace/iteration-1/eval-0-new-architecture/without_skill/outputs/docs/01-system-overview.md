# Section 1 — System Overview

## 1.1 Product Summary

**PayStream** is a cloud-native, real-time payment processing platform built for FinTech Corp. It replaces a legacy monolithic batch payment system that imposed 8–12 hour settlement delays with a microservices architecture that delivers end-to-end transaction confirmation in under 2 seconds.

The platform supports multiple payment channels — consumer mobile/web payments and business-partner bulk payment files — while enforcing PCI-DSS Level 1 compliance and GDPR data-handling requirements for EU customers.

## 1.2 Business Problem Being Solved

| Symptom | Impact | Target State |
|---------|--------|--------------|
| Nightly batch processing | 8–12 hour settlement delay | < 30-second settlement |
| Monolithic architecture | Cannot scale to 500 K tx/day | Horizontally scalable microservices |
| No real-time confirmation | Partners cannot build dependent workflows | Webhook callbacks within 2 s |
| Manual reconciliation | Error-prone, slow audit trail | Automated, auditable ledger |

## 1.3 Strategic Context

- **Organization**: FinTech Corp
- **Product Owner**: Maria Chen
- **Engineering Lead**: Carlos Mendez
- **Compliance Officer**: Janet Kirk (PCI-DSS)
- **Cloud**: AWS (exclusive — existing enterprise agreement)
- **Regulatory**: PCI-DSS Level 1, GDPR (EU customers)
- **Team**: 8 engineers, 2 SRE

## 1.4 Key Metrics and SLOs

| Metric | Target |
|--------|--------|
| End-to-end P99 transaction latency | ≤ 2 seconds |
| Platform availability | 99.99% (< 52 min/year downtime) |
| Daily transaction capacity | 500,000 tx/day (≈ 5.8 tx/s sustained, ~50 tx/s burst) |
| Settlement time | < 30 seconds |
| Transaction loss | Zero (exactly-once processing) |
| RTO (Tier 1 services) | < 5 minutes |
| RPO (Tier 1 services) | < 30 seconds |

## 1.5 User Personas

| Persona | Channel | Primary Need |
|---------|---------|-------------|
| End Customer | Mobile app / Web | Instant payment confirmation (< 2 s) |
| Business Partner | REST API / Bulk file upload | Webhook callbacks, batch status, SLA guarantees |
| Operations Team | Internal dashboard | Transaction monitoring, reconciliation reports |
| Compliance Team | Audit portal | Full audit trail, PCI evidence packages |

## 1.6 Primary Use Cases

1. **Consumer Payment**: Customer initiates payment via mobile/web → real-time authorization and confirmation delivered within 2 seconds.
2. **Partner Bulk Processing**: Business partner sends bulk payment file → system fans out to parallel micro-batches, returns per-record status via webhooks.
3. **Fraud Hold Workflow**: Fraud detection engine flags a suspicious transaction → automatic hold applied, manual review workflow triggered for operations team.
4. **End-of-Day Reconciliation**: Bank reconciliation team generates settlement report; ledger totals reconciled against partner bank statements.

## 1.7 Timeline

| Milestone | Target | Scope |
|-----------|--------|-------|
| MVP | Month 3 | Card payments only |
| Full Platform | Month 6 | All channels, partner integrations |
| PCI Audit | Month 7 | Level 1 certification |
