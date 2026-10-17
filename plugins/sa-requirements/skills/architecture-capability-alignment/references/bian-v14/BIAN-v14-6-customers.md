# BIAN Service Landscape v14.0.0 — Business Area: Customers

This document covers **one** of the eight BIAN Business Areas: **Customers** (model id `33658`). It contains 5 Business Domains and 35 Service Domains, 33 of which have a published semantic API.

The eight BIAN Business Areas are: Business Management, Resource Management, Finance And Risk Management, Operations, Products, Customers, Channels, and Business Development. Service Domains belonging to the other seven areas are documented in their own files.

Each Service Domain below states its path, BIAN id and published API. Where an API exists, **What it does.** is that API's own one-line description, from BIAN's semantic API repository (Apache License 2.0). The Service Landscape's role definitions and examples of use are © BIAN and are not bundled: an institution pack supplies the full text (docs/INSTITUTION_PACKS.md).

Source: the taxonomy of the BIAN Service Landscape V14.0 Value Chain View; API descriptions from github.com/bian-official/public (Apache License 2.0).

---

## Business Domain: Sales

`32952` — part of the Customers Business Area. Contains 9 Service Domains: Prospect Campaign Execution, Party Lifecycle Management, Lead and Opportunity Management, Product Sales Support, Customer Offer, Special Pricing Conditions, Product Expert Sales Support, Product Matching, Customer Campaign Execution.

### Service Domain: Prospect Campaign Execution

**Path:** Customers › Sales › Prospect Campaign Execution  
**BIAN id:** `30604`  
**Business Area:** Customers  
**Business Domain:** Sales

**What it does.** Execute a prospect campaign (version) and track and respond to impact

**API.** Published as `ProspectCampaignExecution.yaml` (OpenAPI 3 and AsyncAPI 3) — control record ProspectCampaignProcedure; behavior qualifiers AnalysisFeedback, CandidateSelection, Execution; 18 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/ProspectCampaignExecution.yaml)

### Service Domain: Party Lifecycle Management

**Path:** Customers › Sales › Party Lifecycle Management  
**BIAN id:** `33507`  
**Business Area:** Customers  
**Business Domain:** Sales

**What it does.** This service domain tracks the state of a party relationship with the bank from the initial checks made during the establishment of a new party connection and subsequently maintained as necessary over the duration of the relationship. The checks and the maintenance requirements will vary by party type and jurisdiction. The checks cover bank specific and legal and regulatory considerations and may be updated based on a standard schedule or by request in specific circumstances.

**API.** Published as `PartyLifecycleManagement.yaml` (OpenAPI 3 and AsyncAPI 3) — control record PartyRelationshipAdministrativePlan; behavior qualifiers Documentation, IdentityProofing, Precedents, Qualification; 15 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/PartyLifecycleManagement.yaml)

### Service Domain: Lead and Opportunity Management

**Path:** Customers › Sales › Lead and Opportunity Management  
**BIAN id:** `35536`  
**Business Area:** Customers  
**Business Domain:** Sales

**What it does.** This service domain captures, classifies and track sales lead/opportunities with established clients for additional products or services. It handles the processing of the opportunity through to the point of formal offer processing.

**API.** Published as `LeadandOpportunityManagement.yaml` (OpenAPI 3 and AsyncAPI 3) — control record LeadandOpportunityProcedure; behavior qualifiers Development; 10 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/LeadandOpportunityManagement.yaml)

### Service Domain: Product Sales Support

**Path:** Customers › Sales › Product Sales Support  
**BIAN id:** `35865`  
**Business Area:** Customers  
**Business Domain:** Sales

**What it does.** This Service Domain administers customer access to product specialists

**API.** Published as `ProductSalesSupport.yaml` (OpenAPI 3 and AsyncAPI 3) — control record ProductSalesSupportAdministrativePlan; behavior qualifiers StaffAssignment, StaffAvailabilityTracking; 20 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/ProductSalesSupport.yaml)

### Service Domain: Customer Offer

**Path:** Customers › Sales › Customer Offer  
**BIAN id:** `36014`  
**Business Area:** Customers  
**Business Domain:** Sales

**What it does.** This service domain orchestrates the processing of a product offer for a new or established customer. The offer process is defined specifically for the product or service being considered and can include actions such as document checks, collateral allocation, credit assessments, underwriting decisions, regulatory and procedural checks, eligibility checks, the use of internal and external specialist services (such as evaluations and legal advice).

**API.** Published as `CustomerOffer.yaml` (OpenAPI 3 and AsyncAPI 3) — control record CustomerOfferProcedure; behavior qualifiers Agreement, Audit, Booking, CollateralAllocation, Compliance, CorrespondenceandDocuments, Credit, Disclosures, FacilityApplication, ProductInitialization, Underwriting; 34 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/CustomerOffer.yaml)

### Service Domain: Special Pricing Conditions

**Path:** Customers › Sales › Special Pricing Conditions  
**BIAN id:** `39359`  
**Business Area:** Customers  
**Business Domain:** Sales

**What it does.** Maintain a pricing list or conditions (with ranges and optional terms) categorized by various dimensions to impose exceptional product pricing conditions that override standard pricing terms (for special events/situations)

**API.** Published as `SpecialPricingConditions.yaml` (OpenAPI 3 and AsyncAPI 3) — control record SpecialPricingConditionsDirectoryEntry; behavior qualifiers PricingTerms; 10 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/SpecialPricingConditions.yaml)

### Service Domain: Product Expert Sales Support

**Path:** Customers › Sales › Product Expert Sales Support  
**BIAN id:** `40643`  
**Business Area:** Customers  
**Business Domain:** Sales

**What it does.** Administer the availability and allocation of product specialists to support sales activity

**API.** Published as `ProductExpertSalesSupport.yaml` (OpenAPI 3 and AsyncAPI 3) — control record SalesSpecialistSupportAdministrativePlan; behavior qualifiers Assignment; 10 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/ProductExpertSalesSupport.yaml)

### Service Domain: Product Matching

**Path:** Customers › Sales › Product Matching  
**BIAN id:** `42799`  
**Business Area:** Customers  
**Business Domain:** Sales

**What it does.** Capability used to match eligible product and product combinations to a customer based on prevailing conditions such as customer type, product interest, solicitation/retention, campaign alignment

**API.** Published as `ProductMatching.yaml` (OpenAPI 3 and AsyncAPI 3) — control record ProducttoCustomerCombinationAssessment; behavior qualifiers BankandCampaignAlignment, ContextCriteria, ProductEligibility, ProductTypeSelection; 19 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/ProductMatching.yaml)

### Service Domain: Customer Campaign Execution

**Path:** Customers › Sales › Customer Campaign Execution  
**BIAN id:** `46481`  
**Business Area:** Customers  
**Business Domain:** Sales

**What it does.** Execute a customer campaign (version) and track and respond to impact

**API.** Published as `CustomerCampaignExecution.yaml` (OpenAPI 3 and AsyncAPI 3) — control record CustomerCampaignProcedure; behavior qualifiers AnalysisFeedback, CandidateSelection, Execution; 18 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/CustomerCampaignExecution.yaml)

## Business Domain: Relationship Management

`146502` — part of the Customers Business Area. Contains 12 Service Domains: Customer Product and Service Directory, Customer Agreement, Customer Behavior Insights, Customer Proposition, Customer Financial Insights, Customer Product And Service Eligibility, Customer Relationship Management, Loan Syndication, Customer Event History, Sales Product Agreement, Customer Consent, Customer Credit Rating.

### Service Domain: Customer Product and Service Directory

**Path:** Customers › Relationship Management › Customer Product and Service Directory  
**BIAN id:** `31128`  
**Business Area:** Customers  
**Business Domain:** Relationship Management

**What it does.** This Service Domain maintains the most important details of all the products and services that a customer has acquired from the bank.

**API.** Published as `CustomerProductandServiceDirectory.yaml` (OpenAPI 3 and AsyncAPI 3) — control record CustomerProductAndServiceDirectoryEntry; behavior qualifiers Product, Service; 19 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/CustomerProductandServiceDirectory.yaml)

### Service Domain: Customer Agreement

**Path:** Customers › Relationship Management › Customer Agreement  
**BIAN id:** `31459`  
**Business Area:** Customers  
**Business Domain:** Relationship Management

**What it does.** This service domain maintains the master customer agreement/legal contract. Note that a customer can be a complex corporate entity with many subsidiaries operating in different geopolitical areas. The customer agreement is linked to as many Sales Product Agreements as needed for all in-force products

**API.** Published as `CustomerAgreement.yaml` (OpenAPI 3 and AsyncAPI 3) — control record CustomerAgreement; behavior qualifiers LegalTerm, PolicyTerm, RegulatoryTerm; 16 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/CustomerAgreement.yaml)

### Service Domain: Customer Behavior Insights

**Path:** Customers › Relationship Management › Customer Behavior Insights  
**BIAN id:** `33180`  
**Business Area:** Customers  
**Business Domain:** Relationship Management

**What it does.** This service domain applies behavioral analysis to customer event history to maintain a range of customer ratings/scores (such as 'propensity to buy') and to detect life events or trends

**API.** Published as `CustomerBehaviorInsights.yaml` (OpenAPI 3 and AsyncAPI 3) — control record CustomerBehaviorAnalysis; behavior qualifiers Insight; 9 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/CustomerBehaviorInsights.yaml)

### Service Domain: Customer Proposition

**Path:** Customers › Relationship Management › Customer Proposition  
**BIAN id:** `33228`  
**Business Area:** Customers  
**Business Domain:** Relationship Management

**What it does.** This Service Domain maintains bank and customer defined requirements spanning all products and services

**API.** Published as `CustomerProposition.yaml` (OpenAPI 3 and AsyncAPI 3) — control record CustomerPropositionAgreement; behavior qualifiers BankDefinedProductandServiceTerm, CustomerDefinedProductandServiceTerm; 21 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/CustomerProposition.yaml)

### Service Domain: Customer Financial Insights

**Path:** Customers › Relationship Management › Customer Financial Insights  
**BIAN id:** `35032`  
**Business Area:** Customers  
**Business Domain:** Relationship Management

**What it does.** This service domain applies behavioral analysis to the customer financial history to develop financial insights that can highlight business development opportunities or detect possible concerns with a customer's financial wellfare

**API.** Published as `CustomerFinancialInsights.yaml` (OpenAPI 3 and AsyncAPI 3) — control record CustomerFinancialPositionAnalysis; 1 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/CustomerFinancialInsights.yaml)

### Service Domain: Customer Product And Service Eligibility

**Path:** Customers › Relationship Management › Customer Product And Service Eligibility  
**BIAN id:** `36228`  
**Business Area:** Customers  
**Business Domain:** Relationship Management

**What it does.** This Service Domain maintains a list of products and services for which a customer is eligible.

**API.** Published as `CustomerProductAndServiceEligibility.yaml` (OpenAPI 3 and AsyncAPI 3) — control record CustomerEligibilityAssessment; behavior qualifiers EligibilityCheck, NextBest; 11 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/CustomerProductAndServiceEligibility.yaml)

### Service Domain: Customer Relationship Management

**Path:** Customers › Relationship Management › Customer Relationship Management  
**BIAN id:** `38281`  
**Business Area:** Customers  
**Business Domain:** Relationship Management

**What it does.** This service domain develops and executes a customer plan to maintain and build a customer relationship. Activities include ongoing customer contact, tracking internal and external events and activity of interest and relevance, product and service matching and sales, processing ad-hoc queries, trouble shooting and issue resolution including the initial phases of troubled account recovery

**API.** Published as `CustomerRelationshipManagement.yaml` (OpenAPI 3 and AsyncAPI 3) — control record CustomerRelationshipManagementPlan; behavior qualifiers Contact, Development, Incident; 22 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/CustomerRelationshipManagement.yaml)

### Service Domain: Loan Syndication

**Path:** Customers › Relationship Management › Loan Syndication  
**BIAN id:** `38742`  
**Business Area:** Customers  
**Business Domain:** Relationship Management

**What it does.** Loan Syndication is a Service Domain that supports orgination, set-up and servicing of syndicated loans. It provides services that are used in lead banks, agents and banks providing administrative support.\nIt handles the orchestration of origination and servicing processes for syndicated loans.

**API.** Published as `LoanSyndication.yaml` (OpenAPI 3 and AsyncAPI 3) — control record SyndicatedLoanApplicationProcedure; 4 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/LoanSyndication.yaml)

### Service Domain: Customer Event History

**Path:** Customers › Relationship Management › Customer Event History  
**BIAN id:** `38793`  
**Business Area:** Customers  
**Business Domain:** Relationship Management

**What it does.** This service domain captures, classifies and stores relationship, servicing and product fulfillment related customer events. In addition to servicing and product transaction details, the log can capture life/relationship events that are revealed during customer exchanges

**API.** Published as `CustomerEventHistory.yaml` (OpenAPI 3 and AsyncAPI 3) — control record CustomerEventLog; behavior qualifiers Fraud, Life, ProductProcessing, Relationship, Sales, Servicing; 22 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/CustomerEventHistory.yaml)

### Service Domain: Sales Product Agreement

**Path:** Customers › Relationship Management › Sales Product Agreement  
**BIAN id:** `39925`  
**Business Area:** Customers  
**Business Domain:** Relationship Management

**What it does.** This service domain maintains a structured legal agreement defining the contractual terms and conditions for an in-force product for a customer. It is subordinate to the customer's master agreement that is maintained by the Customer Agreement service domain

**API.** Published as `SalesProductAgreement.yaml` (OpenAPI 3 and AsyncAPI 3) — control record SalesProductAgreement; behavior qualifiers LegalTerm, PolicyTerm, RegulatoryTerm; 16 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/SalesProductAgreement.yaml)

### Service Domain: Customer Consent

**Path:** Customers › Relationship Management › Customer Consent  
**BIAN id:** `41780`  
**Business Area:** Customers  
**Business Domain:** Relationship Management

**API.** No semantic API published for this Service Domain in BIAN release 14.0.0.

### Service Domain: Customer Credit Rating

**Path:** Customers › Relationship Management › Customer Credit Rating  
**BIAN id:** `42771`  
**Business Area:** Customers  
**Business Domain:** Relationship Management

**What it does.** This service domain maintains and administers the bank's credit assessment for customers based on consolidated internal data and optionally by referencing external credit agency reports

**API.** Published as `CustomerCreditRating.yaml` (OpenAPI 3 and AsyncAPI 3) — control record CustomerCreditRatingState; behavior qualifiers Alerts, ExternalReporting, InternalReporting; 12 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/CustomerCreditRating.yaml)

## Business Domain: Customer Care

`146484` — part of the Customers Business Area. Contains 5 Service Domains: Servicing Mandate, Customer Case, Card Case, Servicing Order, Customer Case Management.

### Service Domain: Servicing Mandate

**Path:** Customers › Customer Care › Servicing Mandate  
**BIAN id:** `28808`  
**Business Area:** Customers  
**Business Domain:** Customer Care

**What it does.** This service domain maintains the allowed customer servicing arrangements for a service provider covering general access to the bank's products and services and optionally customer specific arrangements

**API.** Published as `ServicingMandate.yaml` (OpenAPI 3 and AsyncAPI 3) — control record ServicingMandateAgreement; behavior qualifiers CustomerMandate; 13 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/ServicingMandate.yaml)

### Service Domain: Customer Case

**Path:** Customers › Customer Care › Customer Case  
**BIAN id:** `29502`  
**Business Area:** Customers  
**Business Domain:** Customer Care

**What it does.** This service domain handles the initiation, tracking, resolution and reporting on customer cases (issues that typically require corrective response to some financial transaction)

**API.** Published as `CustomerCase.yaml` (OpenAPI 3 and AsyncAPI 3) — control record CustomerCaseProcedure; behavior qualifiers Analysis, Determination, Resolution; 14 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/CustomerCase.yaml)

### Service Domain: Card Case

**Path:** Customers › Customer Care › Card Case  
**BIAN id:** `35253`  
**Business Area:** Customers  
**Business Domain:** Customer Care

**What it does.** This service domain handles the processing of a customer card case, typically a disputed charge

**API.** Published as `CardCase.yaml` (OpenAPI 3 and AsyncAPI 3) — control record CardCaseProcedure; behavior qualifiers Arbitration, Chargeback, Consolidation, Resolution; 17 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/CardCase.yaml)

### Service Domain: Servicing Order

**Path:** Customers › Customer Care › Servicing Order  
**BIAN id:** `36831`  
**Business Area:** Customers  
**Business Domain:** Customer Care

**What it does.** This service domain handles the processing of a customer servicing request as a predefined procedure. A range of standard servicing requests can be supported. The process can include a check of permissions when the request is made by a third party/service provider

**API.** Published as `ServicingOrder.yaml` (OpenAPI 3 and AsyncAPI 3) — control record ServicingOrderProcedure; 7 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/ServicingOrder.yaml)

### Service Domain: Customer Case Management

**Path:** Customers › Customer Care › Customer Case Management  
**BIAN id:** `47488`  
**Business Area:** Customers  
**Business Domain:** Customer Care

**What it does.** Track and assess case load and resolution activity - allocate resources as necessary to optimize case resolution performance

**API.** Published as `CustomerCaseManagement.yaml` (OpenAPI 3 and AsyncAPI 3) — control record CustomerCaseManagementPlan; behavior qualifiers Performance, Rules; 11 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/CustomerCaseManagement.yaml)

## Business Domain: Party Reference

`146499` — part of the Customers Business Area. Contains 4 Service Domains: Location Data Management, Legal Entity Directory, Party Reference Data Directory, Payee Management.

### Service Domain: Location Data Management

**Path:** Customers › Party Reference › Location Data Management  
**BIAN id:** `29959`  
**Business Area:** Customers  
**Business Domain:** Party Reference

**What it does.** This service domain maintain details of the use and state of locations of interest to the bank. This can include both physical and virtual addresses. It is used to check for valid use and for sales/marketing activities

**API.** Published as `LocationDataManagement.yaml` (OpenAPI 3 and AsyncAPI 3) — control record LocationDirectoryEntry; behavior qualifiers Location, Occupancy, Use; 14 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/LocationDataManagement.yaml)

### Service Domain: Legal Entity Directory

**Path:** Customers › Party Reference › Legal Entity Directory  
**BIAN id:** `32120`  
**Business Area:** Customers  
**Business Domain:** Party Reference

**What it does.** This service domain maintains details of the legal entity structure of the party including dependents and associations for individuals and ownership/subsidiary structures for corporations. Some financial indicators and product coverage/activity details can be included where this defines the nature of the legal entity relationship in particular for corporate entities

**API.** Published as `LegalEntityDirectory.yaml` (OpenAPI 3 and AsyncAPI 3) — control record LegalEntityDirectoryEntry; behavior qualifiers Associations, Profile, Reference; 13 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/LegalEntityDirectory.yaml)

### Service Domain: Party Reference Data Directory

**Path:** Customers › Party Reference › Party Reference Data Directory  
**BIAN id:** `32318`  
**Business Area:** Customers  
**Business Domain:** Party Reference

**What it does.** This service domain maintains a range of party reference information covering aspects including general reference details, contacts and associations and demographic information

**API.** Published as `PartyReferenceDataDirectory.yaml` (OpenAPI 3 and AsyncAPI 3) — control record PartyReferenceDataDirectoryEntry; behavior qualifiers Associations, BankRelations, Demographics, Reference; 17 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/PartyReferenceDataDirectory.yaml)

### Service Domain: Payee Management

**Path:** Customers › Party Reference › Payee Management  
**BIAN id:** `45908`  
**Business Area:** Customers  
**Business Domain:** Party Reference

**API.** No semantic API published for this Service Domain in BIAN release 14.0.0.

## Business Domain: Investment Services

`146490` — part of the Customers Business Area. Contains 5 Service Domains: Consumer Investments, eTrading Workbench, Investment Portfolio Management, Investment Portfolio Planning, Investment Portfolio Analysis.

### Service Domain: Consumer Investments

**Path:** Customers › Investment Services › Consumer Investments  
**BIAN id:** `29821`  
**Business Area:** Customers  
**Business Domain:** Investment Services

**What it does.** Handle the consumer front-end trading requests. These will typically be blocked/netted for market execution

**API.** Published as `ConsumerInvestments.yaml` (OpenAPI 3 and AsyncAPI 3) — control record ConsumerSecuritiesOrderTransaction; behavior qualifiers Compliance, Confirmation, OrderInitiation, Quote; 8 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/ConsumerInvestments.yaml)

### Service Domain: eTrading Workbench

**Path:** Customers › Investment Services › eTrading Workbench  
**BIAN id:** `37073`  
**Business Area:** Customers  
**Business Domain:** Investment Services

**What it does.** This Service Domain supports consumer securities trading of their investment portfolio through the bank

**API.** Published as `eTradingWorkbench.yaml` (OpenAPI 3 and AsyncAPI 3) — control record eTradingWorkbenchOperatingSession; behavior qualifiers InvestmentPortfolioValuation, MarketOrderInitiation, MarketOrderQuotation, MarketPriceAnalysis; 36 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/eTradingWorkbench.yaml)

### Service Domain: Investment Portfolio Management

**Path:** Customers › Investment Services › Investment Portfolio Management  
**BIAN id:** `37093`  
**Business Area:** Customers  
**Business Domain:** Investment Services

**What it does.** Manage an investment portfolio, initiating trading to leverage market opportunities, remaining within portfolio trading policies

**API.** Published as `InvestmentPortfolioManagement.yaml` (OpenAPI 3 and AsyncAPI 3) — control record ManagedInvestmentPortfolioFacility; behavior qualifiers FinancialStatusTracking, Opportunity, Trade; 14 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/InvestmentPortfolioManagement.yaml)

### Service Domain: Investment Portfolio Planning

**Path:** Customers › Investment Services › Investment Portfolio Planning  
**BIAN id:** `39533`  
**Business Area:** Customers  
**Business Domain:** Investment Services

**What it does.** Agree the policies and required make-up of an investment portfolio and ensure all required bank and regulatory terms and conditions are addressed

**API.** Published as `InvestmentPortfolioPlanning.yaml` (OpenAPI 3 and AsyncAPI 3) — control record ManagedInvestmentPortfolioAgreement; behavior qualifiers InvestmentTerms; 11 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/InvestmentPortfolioPlanning.yaml)

### Service Domain: Investment Portfolio Analysis

**Path:** Customers › Investment Services › Investment Portfolio Analysis  
**BIAN id:** `40863`  
**Business Area:** Customers  
**Business Domain:** Investment Services

**What it does.** Assess and report on investment portfolio make-up, valuation and performance

**API.** Published as `InvestmentPortfolioAnalysis.yaml` (OpenAPI 3 and AsyncAPI 3) — control record ManagedInvestmentPortfolioAnalysis; behavior qualifiers PerformanceAnalysis; 9 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/InvestmentPortfolioAnalysis.yaml)
