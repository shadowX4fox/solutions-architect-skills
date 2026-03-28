# Executive Summary & System Overview (S1+S2)

## 1. Executive Summary

PayStream is a cloud-native real-time payment processing platform built on AWS microservices. It replaces a legacy batch system to support 500,000 transactions/day with sub-2-second latency and 99.99% availability.

**Key Metrics:**
- Target TPS: ~6 TPS average, 100 TPS burst
- P99 latency: ≤ 2 seconds end-to-end
- Availability: 99.99% (< 53 min/year downtime)
- Daily transactions: 500,000

## 2. System Overview

### 2.1 Problem Statement
Legacy batch system causes 8-hour settlement delays. Partners require real-time confirmation. System must scale 10× from current 50,000 to 500,000 transactions/day.

### 2.2 Solution Overview
Microservices event-driven architecture on AWS. Kafka event bus for decoupling. Oracle retained for ledger (finance constraint). PCI-DSS Level 1 certified.

### 2.2.1 Design Drivers
- Scale: 10× transaction growth
- Real-time: sub-2s latency requirement
- Compliance: PCI-DSS Level 1
- Reliability: exactly-once processing, RPO < 30s

### 2.3 Primary Use Cases
1. Real-time payment authorization (customer-initiated)
2. Bulk partner payment processing (webhook callbacks)
3. Fraud hold and manual review workflow
4. End-of-day reconciliation and settlement
