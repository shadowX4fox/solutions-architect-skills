# Executive Summary & System Overview (S1+S2)

## 1. Executive Summary

PayStream is a cloud-native real-time payment processing platform. It replaces a legacy batch system to support 500,000 transactions/day with sub-2-second latency and 99.99% availability.

**Key Metrics:**
- Target TPS: ~6 TPS average, 100 TPS burst
- P99 latency: ≤ 2 seconds end-to-end
- Availability: 99.99%
- Daily transactions: 500,000

## 2. System Overview

### 2.1 Problem Statement
Legacy batch system causes 8-hour settlement delays. Partners need real-time confirmation.

### 2.2 Solution Overview
Event-driven microservices on AWS. Kafka event bus. Oracle for ledger. PCI-DSS Level 1.

### 2.3 Primary Use Cases
1. Real-time payment authorization (checkout flow)
2. Bulk partner payment processing
3. Fraud hold and review
4. End-of-day reconciliation
