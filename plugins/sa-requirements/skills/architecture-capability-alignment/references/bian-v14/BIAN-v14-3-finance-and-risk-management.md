# BIAN Service Landscape v14.0.0 — Business Area: Finance And Risk Management

This document covers **one** of the eight BIAN Business Areas: **Finance And Risk Management** (model id `46172`). It contains 6 Business Domains and 27 Service Domains, 10 of which have a published semantic API.

The eight BIAN Business Areas are: Business Management, Resource Management, Finance And Risk Management, Operations, Products, Customers, Channels, and Business Development. Service Domains belonging to the other seven areas are documented in their own files.

Each Service Domain below states its path, BIAN id and published API. Where an API exists, **What it does.** is that API's own one-line description, from BIAN's semantic API repository (Apache License 2.0). The Service Landscape's role definitions and examples of use are © BIAN and are not bundled: an institution pack supplies the full text (docs/INSTITUTION_PACKS.md).

Source: the taxonomy of the BIAN Service Landscape V14.0 Value Chain View; API descriptions from github.com/bian-official/public (Apache License 2.0).

---

## Business Domain: Market Risk

`146493` — part of the Finance And Risk Management Business Area. Contains 5 Service Domains: Position Management, Limit and Exposure Management, Gap Analysis, Economic Capital, Credit and Margin Management.

### Service Domain: Position Management

**Path:** Finance And Risk Management › Market Risk › Position Management  
**BIAN id:** `30731`  
**Business Area:** Finance And Risk Management  
**Business Domain:** Market Risk

**What it does.** The Service Domain tracks the bank's consolidated financial positions for major customers and complex market conditions

**API.** Published as `PositionManagement.yaml` (OpenAPI 3 and AsyncAPI 3) — control record FinancialPositionState; behavior qualifiers TransactionApplication, TrialTransaction; 10 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/PositionManagement.yaml)

### Service Domain: Limit and Exposure Management

**Path:** Finance And Risk Management › Market Risk › Limit and Exposure Management  
**BIAN id:** `33185`  
**Business Area:** Finance And Risk Management  
**Business Domain:** Market Risk

**API.** No semantic API published for this Service Domain in BIAN release 14.0.0.

### Service Domain: Gap Analysis

**Path:** Finance And Risk Management › Market Risk › Gap Analysis  
**BIAN id:** `39280`  
**Business Area:** Finance And Risk Management  
**Business Domain:** Market Risk

**API.** No semantic API published for this Service Domain in BIAN release 14.0.0.

### Service Domain: Economic Capital

**Path:** Finance And Risk Management › Market Risk › Economic Capital  
**BIAN id:** `42590`  
**Business Area:** Finance And Risk Management  
**Business Domain:** Market Risk

**API.** No semantic API published for this Service Domain in BIAN release 14.0.0.

### Service Domain: Credit and Margin Management

**Path:** Finance And Risk Management › Market Risk › Credit and Margin Management  
**BIAN id:** `42913`  
**Business Area:** Finance And Risk Management  
**Business Domain:** Market Risk

**API.** No semantic API published for this Service Domain in BIAN release 14.0.0.

## Business Domain: Compliance

`146477` — part of the Finance And Risk Management Business Area. Contains 5 Service Domains: Guideline Compliance, Regulatory And Legal Authority, Regulatory Reporting, Compliance Reporting, Regulatory Compliance.

### Service Domain: Guideline Compliance

**Path:** Finance And Risk Management › Compliance › Guideline Compliance  
**BIAN id:** `33954`  
**Business Area:** Finance And Risk Management  
**Business Domain:** Compliance

**What it does.** This service domain develops and applies a portfolio of guideline compliance tests to confirm adherence to bank and regulator imposed internal procedures. Tests may be made on complete transaction data or a meaningful samples as appropriate to mitigate exposure to non-compliant behaviors. Compliance checks may be in response to a schedule, a specific request as part of normal processing or may be initiated randomly as an oversight activity

**API.** Published as `GuidelineCompliance.yaml` (OpenAPI 3 and AsyncAPI 3) — control record GuidelineComplianceAssessment; 5 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/GuidelineCompliance.yaml)

### Service Domain: Regulatory And Legal Authority

**Path:** Finance And Risk Management › Compliance › Regulatory And Legal Authority  
**BIAN id:** `34693`  
**Business Area:** Finance And Risk Management  
**Business Domain:** Compliance

**What it does.** Maintain effective relations with regulators, accounting and government agencies. Oversee interactions and reporting as necessary

**API.** Published as `RegulatoryAndLegalAuthority.yaml` (OpenAPI 3 and AsyncAPI 3) — control record RegulatoryAndLegalAuthorityRelationshipManagementPlan; behavior qualifiers EstablishRelations, MaintainRelations, RepresentBankInterests, Troubleshooting; 25 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/RegulatoryAndLegalAuthority.yaml)

### Service Domain: Regulatory Reporting

**Path:** Finance And Risk Management › Compliance › Regulatory Reporting  
**BIAN id:** `39444`  
**Business Area:** Finance And Risk Management  
**Business Domain:** Compliance

**What it does.** This service domain administers and orchestrates the tasks required to meet the bank's regulatory reporting obligations

**API.** Published as `RegulatoryReporting.yaml` (OpenAPI 3 and AsyncAPI 3) — control record RegulatoryComplianceAdministrativePlan; behavior qualifiers Authoring, Consolidation, Enquiries; 13 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/RegulatoryReporting.yaml)

### Service Domain: Compliance Reporting

**Path:** Finance And Risk Management › Compliance › Compliance Reporting  
**BIAN id:** `45663`  
**Business Area:** Finance And Risk Management  
**Business Domain:** Compliance

**What it does.** This service domain administers and orchestrates the tasks required to apply and report on internal audit control and reporting activity

**API.** Published as `ComplianceReporting.yaml` (OpenAPI 3 and AsyncAPI 3) — control record ComplianceReportingAdministrativePlan; behavior qualifiers ComplianceAssessment, Consolidation, Remediation; 18 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/ComplianceReporting.yaml)

### Service Domain: Regulatory Compliance

**Path:** Finance And Risk Management › Compliance › Regulatory Compliance  
**BIAN id:** `47944`  
**Business Area:** Finance And Risk Management  
**Business Domain:** Compliance

**What it does.** This service domain provides a service to interpret regulatory requirements, provide guidance and define and implement a portfolio of regulatory compliance tests across all appropriate bank activities

**API.** Published as `RegulatoryCompliance.yaml` (OpenAPI 3 and AsyncAPI 3) — control record RegulatoryComplianceAssessment; 5 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/RegulatoryCompliance.yaml)

## Business Domain: Financial Control

`46017` — part of the Finance And Risk Management Business Area. Contains 6 Service Domains: Financial Compliance, Financial Statements, Financial Control, Company Billing and Payments, Approved Supplier Directory, Enterprise Tax Administration.

### Service Domain: Financial Compliance

**Path:** Finance And Risk Management › Financial Control › Financial Compliance  
**BIAN id:** `37849`  
**Business Area:** Finance And Risk Management  
**Business Domain:** Financial Control

**API.** No semantic API published for this Service Domain in BIAN release 14.0.0.

### Service Domain: Financial Statements

**Path:** Finance And Risk Management › Financial Control › Financial Statements  
**BIAN id:** `38750`  
**Business Area:** Finance And Risk Management  
**Business Domain:** Financial Control

**API.** No semantic API published for this Service Domain in BIAN release 14.0.0.

### Service Domain: Financial Control

**Path:** Finance And Risk Management › Financial Control › Financial Control  
**BIAN id:** `41662`  
**Business Area:** Finance And Risk Management  
**Business Domain:** Financial Control

**API.** No semantic API published for this Service Domain in BIAN release 14.0.0.

### Service Domain: Company Billing and Payments

**Path:** Finance And Risk Management › Financial Control › Company Billing and Payments  
**BIAN id:** `41985`  
**Business Area:** Finance And Risk Management  
**Business Domain:** Financial Control

**API.** No semantic API published for this Service Domain in BIAN release 14.0.0.

### Service Domain: Approved Supplier Directory

**Path:** Finance And Risk Management › Financial Control › Approved Supplier Directory  
**BIAN id:** `43202`  
**Business Area:** Finance And Risk Management  
**Business Domain:** Financial Control

**API.** No semantic API published for this Service Domain in BIAN release 14.0.0.

### Service Domain: Enterprise Tax Administration

**Path:** Finance And Risk Management › Financial Control › Enterprise Tax Administration  
**BIAN id:** `45260`  
**Business Area:** Finance And Risk Management  
**Business Domain:** Financial Control

**API.** No semantic API published for this Service Domain in BIAN release 14.0.0.

## Business Domain: Credit Risk

`146481` — part of the Finance And Risk Management Business Area. Contains 3 Service Domains: Fraud Resolution, Counterparty Risk, Credit Management.

### Service Domain: Fraud Resolution

**Path:** Finance And Risk Management › Credit Risk › Fraud Resolution  
**BIAN id:** `33707`  
**Business Area:** Finance And Risk Management  
**Business Domain:** Credit Risk

**What it does.** This service domain sets up and processes a fraud case resulting from fraud behavior that has been detected during production processing

**API.** Published as `FraudResolution.yaml` (OpenAPI 3 and AsyncAPI 3) — control record FraudResolutionProcedure; behavior qualifiers CaseAnalysis, CaseDetermination, CaseResolution; 9 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/FraudResolution.yaml)

### Service Domain: Counterparty Risk

**Path:** Finance And Risk Management › Credit Risk › Counterparty Risk  
**BIAN id:** `36279`  
**Business Area:** Finance And Risk Management  
**Business Domain:** Credit Risk

**API.** No semantic API published for this Service Domain in BIAN release 14.0.0.

### Service Domain: Credit Management

**Path:** Finance And Risk Management › Credit Risk › Credit Management  
**BIAN id:** `47019`  
**Business Area:** Finance And Risk Management  
**Business Domain:** Credit Risk

**What it does.** This service domain provides a bank-wide/oversight function to qualify credit pricing for offered products and services to reflect the bank's appetite to write the business. This decision can override the standard product pricing procedure

**API.** Published as `CreditManagement.yaml` (OpenAPI 3 and AsyncAPI 3) — control record CreditPricingAssessment; 5 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/CreditManagement.yaml)

## Business Domain: Operational Risk

`146496` — part of the Finance And Risk Management Business Area. Contains 3 Service Domains: Operational Risk Models, Business Risk Models, Production Risk Models.

### Service Domain: Operational Risk Models

**Path:** Finance And Risk Management › Operational Risk › Operational Risk Models  
**BIAN id:** `33627`  
**Business Area:** Finance And Risk Management  
**Business Domain:** Operational Risk

**API.** No semantic API published for this Service Domain in BIAN release 14.0.0.

### Service Domain: Business Risk Models

**Path:** Finance And Risk Management › Operational Risk › Business Risk Models  
**BIAN id:** `35577`  
**Business Area:** Finance And Risk Management  
**Business Domain:** Operational Risk

**API.** No semantic API published for this Service Domain in BIAN release 14.0.0.

### Service Domain: Production Risk Models

**Path:** Finance And Risk Management › Operational Risk › Production Risk Models  
**BIAN id:** `44798`  
**Business Area:** Finance And Risk Management  
**Business Domain:** Operational Risk

**API.** No semantic API published for this Service Domain in BIAN release 14.0.0.

## Business Domain: Group Treasury

`146487` — part of the Finance And Risk Management Business Area. Contains 5 Service Domains: Bank Portfolio Analysis, Asset Securitization, Corporate Treasury Analysis, Bank Portfolio Administration, Corporate Treasury.

### Service Domain: Bank Portfolio Analysis

**Path:** Finance And Risk Management › Group Treasury › Bank Portfolio Analysis  
**BIAN id:** `34350`  
**Business Area:** Finance And Risk Management  
**Business Domain:** Group Treasury

**API.** No semantic API published for this Service Domain in BIAN release 14.0.0.

### Service Domain: Asset Securitization

**Path:** Finance And Risk Management › Group Treasury › Asset Securitization  
**BIAN id:** `34534`  
**Business Area:** Finance And Risk Management  
**Business Domain:** Group Treasury

**What it does.** Determine and select assets for securitization as needed to maintain and optimize the Bank's portfolio. Administer the securitization process

**API.** Published as `AssetSecuritization.yaml` (OpenAPI 3 and AsyncAPI 3) — control record AssetSecuritizationTransaction; behavior qualifiers Placement, Securitization, Selection; 22 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/AssetSecuritization.yaml)

### Service Domain: Corporate Treasury Analysis

**Path:** Finance And Risk Management › Group Treasury › Corporate Treasury Analysis  
**BIAN id:** `40508`  
**Business Area:** Finance And Risk Management  
**Business Domain:** Group Treasury

**API.** No semantic API published for this Service Domain in BIAN release 14.0.0.

### Service Domain: Bank Portfolio Administration

**Path:** Finance And Risk Management › Group Treasury › Bank Portfolio Administration  
**BIAN id:** `41596`  
**Business Area:** Finance And Risk Management  
**Business Domain:** Group Treasury

**API.** No semantic API published for this Service Domain in BIAN release 14.0.0.

### Service Domain: Corporate Treasury

**Path:** Finance And Risk Management › Group Treasury › Corporate Treasury  
**BIAN id:** `46157`  
**Business Area:** Finance And Risk Management  
**Business Domain:** Group Treasury

**What it does.** This service domain orchestrates the consolidation and presentation of summary transaction details in order to assemble a timely and accurate view of the overall treasury position of the Bank at any one time. It is also responsible for determining the different interest and exchange rates applied to different products and services within the bank

**API.** Published as `CorporateTreasury.yaml` (OpenAPI 3 and AsyncAPI 3) — control record CorporateTreasuryManagementPlan; behavior qualifiers BankRates, Liquidity, Securitization, StrategicFunding, TacticalFunding; 11 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/CorporateTreasury.yaml)
