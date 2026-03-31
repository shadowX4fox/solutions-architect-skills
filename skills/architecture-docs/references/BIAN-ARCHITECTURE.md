# BIAN Architecture — Banking Industry Architecture Network V12.0

## What is it

BIAN (Banking Industry Architecture Network) is a not-for-profit industry body that defines a **standardized service landscape** for the financial services industry. BIAN provides a canonical vocabulary of business capabilities, service domains, and service operations that banks can use to design interoperable, reusable, and standards-compliant architectures.

The BIAN V12.0 Service Landscape defines **326+ Service Domains** organized into **30+ Business Domains** under **5 Business Areas**. Each Service Domain is a standardized bounded context with a defined Control Record, Behavior Qualifiers, and 7 standard Service Operations.

This reference describes the **BIAN 5-Layer Architecture** — a layered model designed for banking systems requiring full BIAN V12.0 certification and regulatory compliance.

---

## Core Principles

| Principle | Description |
|-----------|-------------|
| **Service Orientation** | Every banking function is exposed as a standardized service with well-defined operations |
| **Standard Semantics** | BIAN defines the vocabulary — Service Domain names, Control Records, operations — eliminating ambiguity across teams and vendors |
| **Interoperability** | Standardized APIs enable plug-and-play integration between BIAN-compliant systems, regardless of vendor |
| **Reusability** | Service Domains are designed to be reused across business scenarios without modification |
| **BIAN V12.0 Compliance** | Three architecture layers (2, 3, 4) must align with the BIAN hierarchy: Business Areas, Business Domains, Service Domains |
| **Separation of Concerns** | Each layer has a distinct responsibility; no layer bypasses another |

---

## The 5 Layers

```
+------------------------------------------------------------------+
|                    Layer 1: Channels                              |
|   BancaWeb, Banca Movil, ATM, Branch, Open Banking API, IVR     |
+------------------------------------------------------------------+
          | REST / GraphQL / WebSocket
          v
+------------------------------------------------------------------+
|            Layer 2: BIAN Business Scenarios                      |
|   Orchestration of BIAN service operations across domains        |
|   Aligned with 5 BIAN Business Areas                             |
+------------------------------------------------------------------+
          | Internal API / Events
          v
+------------------------------------------------------------------+
|          Layer 3: BIAN Business Capabilities                     |
|   Business logic consuming BIAN Service Domains                  |
|   Aligned with 30+ BIAN Business Domains                         |
+------------------------------------------------------------------+
          | BIAN REST API / Events
          v
+------------------------------------------------------------------+
|           Layer 4: BIAN Service Domains                          |
|   The core — standardized bounded contexts per BIAN V12.0        |
|   326+ Service Domains with Control Records + Service Operations |
+------------------------------------------------------------------+
          | Database protocols / Legacy adapters
          v
+------------------------------------------------------------------+
|              Layer 5: Core Systems                                |
|   Legacy cores, data stores, mainframes, external SaaS           |
+------------------------------------------------------------------+
```

### Layer 1: Channels

**Purpose**: User interaction points — how customers and employees access banking services.

**Typical Components**:

| Channel | Technology | Users |
|---------|-----------|-------|
| BancaWeb (Internet Banking) | Angular / React SPA | Retail customers |
| Banca Movil (Mobile Banking) | React Native / Flutter | Retail customers |
| ATM Network | Embedded Java / C++ | Retail customers |
| Branch Terminal | Desktop application | Bank employees |
| Open Banking API | API Gateway (Kong, Apigee) | Third-party fintechs (PSD2/Open Banking) |
| IVR / Chatbot | Dialogflow / Amazon Lex | Retail customers |
| Contact Center | CRM integration | Bank employees |

**Key Responsibilities**:
- Provide omnichannel access to banking services
- Authenticate users (biometrics, OTP, OAuth 2.0)
- Adapt UI/UX to channel constraints (mobile vs. web vs. ATM)
- Route requests to Layer 2 Business Scenarios

**Communication**:
- Inbound: HTTPS, mobile protocols, ATM protocols (NDC/DDC)
- Outbound: REST/GraphQL to Layer 2
- Security: OAuth 2.0, mTLS, device fingerprinting

---

### Layer 2: BIAN Business Scenarios

**Purpose**: Orchestrate end-to-end business processes by composing BIAN service operations from multiple Service Domains across multiple Business Areas.

**BIAN V12.0 Alignment**: This layer maps to the **5 BIAN Business Areas**:

| # | BIAN Business Area | Example Scenarios |
|---|-------------------|-------------------|
| 1 | **Sales and Service** | Customer onboarding, product origination, cross-sell |
| 2 | **Reference Data** | Party master management, product catalog updates |
| 3 | **Operations and Execution** | Payment processing, trade settlement, clearing |
| 4 | **Risk and Compliance** | Credit risk assessment, AML screening, regulatory reporting |
| 5 | **Business Support** | Financial reporting, internal audit, analytics |

**Key Responsibilities**:
- Orchestrate multi-step business scenarios across BIAN Business Areas
- Coordinate calls to Layer 3 Business Capabilities in sequence or parallel
- Manage saga/compensation patterns for distributed transactions
- Apply cross-domain business rules and policies
- Track scenario state and lifecycle

**Technologies**:
- Workflow engines: Camunda, Apache Airflow, AWS Step Functions
- Rules engines: Drools, Easy Rules
- Saga orchestrators: Temporal, custom

**Example — Customer Onboarding Scenario**:
```
1. Channel receives onboarding request
   → Layer 2: Customer Onboarding Scenario starts

2. Scenario orchestrates:
   a. Initiate Party Reference Data Directory (SD) → create party record
   b. Initiate Customer Relationship Management (SD) → create relationship
   c. Execute KYC/AML screening via Regulatory Compliance (SD)
   d. Initiate Current Account (SD) → open account
   e. Initiate Payment Initiation (SD) → enable payments
   f. Execute Customer Offer (SD) → generate welcome offer

3. If step (c) fails → compensate steps (a), (b)
4. Return result to Channel
```

---

### Layer 3: BIAN Business Capabilities

**Purpose**: Implement business logic that consumes and coordinates BIAN Service Domains. Each capability maps to a **BIAN Business Domain**.

**BIAN V12.0 Alignment**: This layer maps to the **30+ BIAN Business Domains**. Selected examples:

| BIAN Business Domain | Capability | Service Domains Consumed |
|---------------------|------------|-------------------------|
| Customer Management | Customer Lifecycle Manager | Party Reference Data Directory, Customer Relationship Management, Customer Offer |
| Payments | Payment Processor | Payment Initiation, Payment Execution, Payment Order |
| Savings & Deposits | Deposit Account Manager | Savings Account, Current Account, Deposit Account |
| Lending | Loan Lifecycle Manager | Consumer Loan, Mortgage Loan, Loan Administration |
| Cards | Card Operations Manager | Card Transaction, Card Authorization, Card Capture |
| Risk | Credit Risk Assessor | Credit Risk Models, Counterparty Risk, Credit Administration |

**Key Responsibilities**:
- Implement business logic that spans multiple Service Domains
- Apply business policies and decision logic
- Cache frequently used reference data
- Expose higher-level APIs to Layer 2 scenarios
- Handle business domain-level events

---

### Layer 4: BIAN Service Domains (The Core)

**Purpose**: Provide atomic, standardized banking services following BIAN V12.0 specifications. This is the most critical layer for BIAN compliance.

#### What is a Service Domain?

A BIAN Service Domain (SD) is a **standardized bounded context** that manages a specific banking function. Each SD has:

1. **A Control Record** — the central data entity the SD manages
2. **Behavior Qualifiers (BQs)** — sub-domains within the SD that manage aspects of the Control Record
3. **Service Operations** — the 7 standard actions that can be performed on the Control Record or its BQs

#### Control Record

The Control Record is the primary data entity owned by the Service Domain. It represents the "thing" the SD manages.

| Service Domain | Control Record | Description |
|---------------|---------------|-------------|
| Savings Account | SavingsAccountFacility | Manages a savings account facility |
| Current Account | CurrentAccountFacility | Manages a current/checking account |
| Payment Initiation | PaymentInitiationTransaction | Manages a payment initiation request |
| Customer Relationship Management | CustomerRelationshipManagementPlan | Manages the relationship plan |
| Party Reference Data Directory | PartyReferenceDataDirectoryEntry | Manages party reference records |
| Consumer Loan | ConsumerLoanFacility | Manages a consumer loan lifecycle |

#### Behavior Qualifiers (BQs)

Behavior Qualifiers subdivide the Control Record into manageable aspects. They represent the dimensions of a Service Domain's responsibility.

**Example: Savings Account SD**

| Behavior Qualifier | Purpose |
|-------------------|---------|
| Interest | Manage interest calculation and accrual |
| Fees | Manage account fees and charges |
| DepositsAndWithdrawals | Handle deposit and withdrawal transactions |
| Payments | Manage payment instructions from the account |
| Statements | Generate and manage account statements |
| ServiceFees | Manage service fee schedules |
| AccountLien | Manage liens and holds on the account |
| AccountSweep | Manage automated sweep arrangements |
| IssuedDevice | Manage issued devices (debit cards, tokens) |

#### Service Operations (7 Standard)

Every BIAN Service Domain supports up to 7 standard operations. Not all SDs implement all 7 — some operations are not applicable to certain SDs.

| Operation | HTTP Verb | Purpose | Example (Savings Account SD) |
|-----------|----------|---------|-------------------------------|
| **Initiate** | POST | Create a new instance of the Control Record | Open a new savings account |
| **Update** | PUT | Modify the Control Record or BQ | Update account details |
| **Retrieve** | GET | Read the Control Record or BQ state | Get account balance |
| **Control** | PUT | Apply a control action (suspend, resume, cancel) | Suspend account for fraud |
| **Exchange** | PUT | Exchange information with an external party | Send account statement to regulator |
| **Execute** | PUT | Trigger an automated/scheduled action | Execute interest calculation |
| **Request** | POST | Request an action that requires approval/processing | Request account closure |

#### Functional Patterns

BIAN defines Functional Patterns that classify Service Domains by behavior:

| Pattern | Behavior | Example SDs |
|---------|----------|-------------|
| **Direct** | Manages a facility/product instance | Savings Account, Current Account, Consumer Loan |
| **Transact** | Manages individual transactions | Payment Execution, Card Transaction |
| **Fulfill** | Fulfills a request or obligation | Payment Order, Trade Settlement |
| **Monitor** | Monitors and detects conditions | Fraud Detection, Market Analysis |
| **Allocate** | Allocates resources or capacity | Resource Allocation, Capacity Planning |
| **Administer** | Administers policies and rules | Credit Administration, Regulatory Compliance |
| **Design** | Designs products and services | Product Design, Service Design |
| **Catalog** | Maintains a catalog or directory | Party Reference Data Directory, Product Directory |

---

### Layer 5: Core Systems

**Purpose**: Legacy and foundational systems that provide the system of record. Layer 4 Service Domains interact with Core Systems through adapters and anti-corruption layers.

**Typical Components**:

| System | Technology | Role |
|--------|-----------|------|
| Core Banking System | Mainframe (COBOL), Temenos T24, Finastra | System of record for accounts and transactions |
| Card Processing | TSYS, FIS, Fiserv | Card lifecycle and authorization |
| Payment Switch | ISO 8583 gateway, SWIFT | Interbank payment routing |
| Data Warehouse | Oracle, Teradata, Snowflake | Analytical reporting and BI |
| Document Management | FileNet, Alfresco | Document storage and retrieval |
| External SaaS | Salesforce, SAP | CRM, ERP |

**Key Responsibilities**:
- Provide authoritative data (system of record)
- Process high-volume batch operations
- Interface with national payment networks (ACH, SWIFT, SEPA)
- Maintain regulatory audit trails

**Integration Patterns**:
- **Anti-corruption Layer**: Adapters translate between BIAN semantics and legacy formats
- **Event Sourcing**: Core changes published as events consumed by Layer 4
- **Batch Sync**: Nightly reconciliation between Layer 4 and Core

---

## BIAN Compliance Requirements

### 12 Mandatory Metadata Fields per Service Domain

Every BIAN-compliant Service Domain must document these metadata fields:

| # | Field | Description | Example |
|---|-------|-------------|---------|
| 1 | **SD Name** | Official BIAN Service Domain name | Savings Account |
| 2 | **SD ID** | BIAN reference identifier | SD-0152 |
| 3 | **BIAN Version** | BIAN specification version | V12.0 |
| 4 | **Business Area** | Parent BIAN Business Area | Operations and Execution |
| 5 | **Business Domain** | Parent BIAN Business Domain | Savings & Deposits |
| 6 | **Functional Pattern** | BIAN functional pattern classification | Direct |
| 7 | **Control Record** | Name of the primary managed entity | SavingsAccountFacility |
| 8 | **Behavior Qualifiers** | List of applicable BQs | Interest, Fees, DepositsAndWithdrawals, ... |
| 9 | **Service Operations** | Applicable operations (of the 7 standard) | Initiate, Update, Retrieve, Control, Execute |
| 10 | **Asset Type** | Classification of managed asset | Facility |
| 11 | **Description** | Purpose and scope of the SD | Manages savings account facilities including interest, fees, and transactions |
| 12 | **Generic Artifact** | BIAN generic artifact reference | BQ: Arrangement |

### 7 Standard Operations per Service Domain

Each SD must define which of the 7 standard operations it supports, with REST endpoint mappings:

```
Base URL: /bian/v12/{service-domain-name}/{cr-reference-id}

Initiate:  POST   /bian/v12/savings-account
Update:    PUT    /bian/v12/savings-account/{cr-id}
Retrieve:  GET    /bian/v12/savings-account/{cr-id}
Control:   PUT    /bian/v12/savings-account/{cr-id}/control
Exchange:  PUT    /bian/v12/savings-account/{cr-id}/exchange
Execute:   PUT    /bian/v12/savings-account/{cr-id}/execution
Request:   POST   /bian/v12/savings-account/{cr-id}/requisition

Behavior Qualifier endpoints:
Initiate BQ:  POST   /bian/v12/savings-account/{cr-id}/interest/initiation
Retrieve BQ:  GET    /bian/v12/savings-account/{cr-id}/interest/{bq-id}
Update BQ:    PUT    /bian/v12/savings-account/{cr-id}/interest/{bq-id}
```

### Control Record Structure

The Control Record follows the BIAN V12.0 specification structure:

```json
{
  "SavingsAccountFacility": {
    "ProductInstanceReference": "SAV-2024-001",
    "CustomerReference": "CUST-12345",
    "BankBranchLocationReference": "BR-001",
    "AccountType": "Savings",
    "AccountCurrency": "USD",
    "TaxReference": "TAX-99887",
    "EntitlementOptionDefinition": "Standard",
    "RestrictionOptionDefinition": "None",
    "Associations": {
      "AssociationType": "Primary Account Holder",
      "AssociationReference": "CUST-12345"
    },
    "LinkedAccounts": {
      "LinkType": "Sweep Source",
      "AccountReference": "CHK-2024-002"
    },
    "PositionLimits": {
      "PositionLimitType": "Daily Withdrawal",
      "PositionLimitValue": 10000,
      "PositionLimitCurrency": "USD"
    }
  }
}
```

---

## How It Works — Request Lifecycle

### Example: Balance Inquiry

```
1. Customer opens Mobile App (Layer 1: Channel)
   → Authenticates via biometrics + OAuth 2.0

2. App calls GET /api/accounts/{id}/balance
   → Layer 2: No scenario orchestration needed (single SD call)
   → Routes directly to Layer 3

3. Layer 3: Deposit Account Manager (Business Capability)
   → Determines correct SD: Savings Account
   → Calls Layer 4

4. Layer 4: Savings Account SD
   → Operation: Retrieve
   → GET /bian/v12/savings-account/{cr-id}
   → Reads from local data store or calls Layer 5

5. Layer 5: Core Banking System
   → Returns authoritative balance from mainframe
   → Anti-corruption layer translates COBOL copybook → JSON

6. Response flows back:
   Layer 5 → Layer 4 (BIAN format) → Layer 3 → Layer 2 → Layer 1
   → Customer sees balance on mobile screen
```

### Example: Fund Transfer (Multi-SD Scenario)

```
1. Customer initiates transfer on BancaWeb (Layer 1)

2. Layer 2: Fund Transfer Scenario orchestrates:
   a. Retrieve source account (Savings Account SD)
   b. Retrieve destination account (Current Account SD)
   c. Validate sufficient funds (Savings Account SD → Retrieve BQ)
   d. Initiate payment (Payment Initiation SD → Initiate)
   e. Execute payment (Payment Execution SD → Execute)
   f. Update source balance (Savings Account SD → Execute BQ: DepositsAndWithdrawals)
   g. Update destination balance (Current Account SD → Execute BQ: DepositsAndWithdrawals)

3. If step (e) fails:
   → Saga compensates: reverse steps (f), (d)
   → Notify customer of failure

4. Success:
   → Publish FundTransferCompleted event
   → Notification SD sends confirmation to customer
```

---

## Implementation

### REST API Design (BIAN Semantic APIs)

BIAN publishes semantic API specifications that define the exact request/response payloads for each SD. Implementations must follow these specs:

```
# Initiate a Savings Account
POST /bian/v12/savings-account/initiation
Content-Type: application/json

{
  "SavingsAccountFacility": {
    "CustomerReference": "CUST-12345",
    "AccountType": "Savings",
    "AccountCurrency": "USD",
    "ProductInstanceReference": "PROD-SAV-001"
  }
}

# Response
201 Created
{
  "SavingsAccountFacility": {
    "SavingsAccountFacilityReference": "SAV-2024-001",
    "CustomerReference": "CUST-12345",
    "AccountStatus": "Active",
    ...
  }
}
```

### Event-Driven BIAN

Domain events follow BIAN naming conventions:

| Event | Source SD | Consumers |
|-------|----------|-----------|
| `SavingsAccountFacility.Initiated` | Savings Account | Customer RM, Notification |
| `PaymentInitiationTransaction.Initiated` | Payment Initiation | Payment Execution, Fraud Detection |
| `PaymentExecutionTransaction.Completed` | Payment Execution | Savings Account, Current Account, Notification |
| `CustomerRelationshipManagementPlan.Updated` | Customer RM | Party Reference, Customer Offer |

**Kafka Topic Convention**: `bian.v12.{business-area}.{sd-name}.{operation}`
- Example: `bian.v12.operations.savings-account.initiated`
- Example: `bian.v12.operations.payment-execution.completed`

### Technology Stack

| Layer | Technology Options |
|-------|--------------------|
| Layer 1: Channels | React, Angular, React Native, Flutter |
| Layer 2: Scenarios | Camunda, Temporal, AWS Step Functions |
| Layer 3: Capabilities | Spring Boot, Quarkus, .NET Core |
| Layer 4: Service Domains | Spring Boot + BIAN API stubs, Quarkus, MuleSoft |
| Layer 5: Core | Mainframe adapters, MQ connectors, JDBC |
| Cross-cutting | Kafka (events), Kong/Apigee (API gateway), Vault (secrets) |

---

## BIAN Service Landscape V12.0

The complete BIAN V12.0 landscape is available at: [bian.org/servicelandscape-12-0-0](https://bian.org/servicelandscape-12-0-0/views/view_51891.html)

### Business Area Summary

| Business Area | Business Domains | Service Domains (approx.) |
|--------------|-----------------|--------------------------|
| Sales and Service | Customer Management, Product Management, Sales | ~80 SDs |
| Reference Data | Party, Product, Location, Market data | ~50 SDs |
| Operations and Execution | Payments, Securities, Trade, Deposits | ~90 SDs |
| Risk and Compliance | Credit Risk, Market Risk, Regulatory | ~60 SDs |
| Business Support | Finance, HR, IT, Analytics | ~46 SDs |
| **Total** | **30+ domains** | **326+ SDs** |

### Commonly Used Service Domains

| SD Name | SD ID | Business Domain | Control Record |
|---------|-------|----------------|---------------|
| Savings Account | SD-0152 | Savings & Deposits | SavingsAccountFacility |
| Current Account | SD-0042 | Deposits | CurrentAccountFacility |
| Payment Initiation | SD-0126 | Payments | PaymentInitiationTransaction |
| Payment Execution | SD-0125 | Payments | PaymentExecutionTransaction |
| Customer Relationship Management | SD-0040 | Customer Management | CustomerRelationshipManagementPlan |
| Party Reference Data Directory | SD-0127 | Party | PartyReferenceDataDirectoryEntry |
| Consumer Loan | SD-0036 | Lending | ConsumerLoanFacility |
| Card Transaction | SD-0022 | Cards | CardTransactionCapture |
| Fraud Detection | SD-0064 | Risk | FraudDetectionAnalysis |
| Regulatory Compliance | SD-0144 | Compliance | RegulatoryComplianceAssessment |

---

## When to Use

**Use BIAN Architecture when**:
- The organization is a bank or financial institution pursuing BIAN certification
- Regulatory compliance requires standardized service definitions (PSD2, Open Banking)
- Multiple vendors must integrate through a common service vocabulary
- The enterprise architecture must align with industry-standard banking reference models
- Legacy modernization requires a target-state reference architecture

**Do NOT use BIAN Architecture when**:
- The system is not in the banking/financial services domain
- The organization does not require BIAN certification
- The team size and system scope do not justify the overhead of BIAN compliance
- A simpler architecture (3-Tier, Microservices, META) meets business needs

---

## Key Distinction from META Architecture

| Aspect | META 6-Layer | BIAN 5-Layer |
|--------|-------------|-------------|
| Layer count | 6 (Channels, UX, Business Scenarios, Business, Domain, Core) | 5 (Channels, Business Scenarios, Business Capabilities, Service Domains, Core) |
| BIAN compliance | Layer 5 (Domain) only | Layers 2, 3, and 4 — full BIAN hierarchy |
| UX Layer | Dedicated Layer 2 for BFF/UX | No dedicated UX layer (handled in Channels) |
| Service Domain modeling | Layer 5 uses BIAN SD vocabulary | Layer 4 implements full BIAN SD spec with Control Records, BQs, and 7 operations |
| Target audience | Large enterprise with BIAN-informed domain layer | Banks requiring full BIAN V12.0 certification |
| Certification readiness | Partial (BIAN vocabulary only) | Full (BIAN-compliant at 3 layers) |

---

## References

- **BIAN Official**: [bian.org](https://bian.org)
- **BIAN Service Landscape V12.0**: [bian.org/servicelandscape-12-0-0](https://bian.org/servicelandscape-12-0-0/views/view_51891.html)
- **BIAN API Portal**: [portal.bian.org](https://portal.bian.org)
- **BIAN + ArchiMate**: BIAN reference architecture modeled in ArchiMate for enterprise architecture tools
- **BIAN + AWS**: AWS Financial Services Reference Architecture with BIAN alignment
- **BIAN + Azure**: Microsoft Azure Banking Reference Architecture with BIAN Service Domains
- **BIAN Practitioner Guide**: Available from bian.org for certified members
