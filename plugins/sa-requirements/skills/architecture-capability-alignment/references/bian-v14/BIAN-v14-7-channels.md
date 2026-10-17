# BIAN Service Landscape v14.0.0 — Business Area: Channels

This document covers **one** of the eight BIAN Business Areas: **Channels** (model id `38201`). It contains 5 Business Domains and 33 Service Domains, 33 of which have a published semantic API.

The eight BIAN Business Areas are: Business Management, Resource Management, Finance And Risk Management, Operations, Products, Customers, Channels, and Business Development. Service Domains belonging to the other seven areas are documented in their own files.

Each Service Domain below states its path, BIAN id and published API. Where an API exists, **What it does.** is that API's own one-line description, from BIAN's semantic API repository (Apache License 2.0). The Service Landscape's role definitions and examples of use are © BIAN and are not bundled: an institution pack supplies the full text (docs/INSTITUTION_PACKS.md).

Source: the taxonomy of the BIAN Service Landscape V14.0 Value Chain View; API descriptions from github.com/bian-official/public (Apache License 2.0).

---

## Business Domain: Information Providers

`146488` — part of the Channels Business Area. Contains 7 Service Domains: Financial Instrument Reference Data Management, Market Information Management, Financial Market Analysis, Market Data Switch Operation, Financial Market Research, Public Reference Data Management, Information Provider Operation.

### Service Domain: Financial Instrument Reference Data Management

**Path:** Channels › Information Providers › Financial Instrument Reference Data Management  
**BIAN id:** `31580`  
**Business Area:** Channels  
**Business Domain:** Information Providers

**What it does.** This Service Domain maintains a directory of financial instrument reference data

**API.** Published as `FinancialInstrumentReferenceDataManagement.yaml` (OpenAPI 3 and AsyncAPI 3) — control record FinancialInstrumentDirectoryEntry; behavior qualifiers Currency, DebtInstrument, Equity, Futures, Option, Warrant; 40 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/FinancialInstrumentReferenceDataManagement.yaml)

### Service Domain: Market Information Management

**Path:** Channels › Information Providers › Market Information Management  
**BIAN id:** `33555`  
**Business Area:** Channels  
**Business Domain:** Information Providers

**What it does.** Market information management consolidates and improves market information from multiple sources in order to build up a bank knowledge base in targeted areas

**API.** Published as `MarketInformationManagement.yaml` (OpenAPI 3 and AsyncAPI 3) — control record FinancialMarketInformationAdministrativePlan; behavior qualifiers Consolidation, Improvement, Reporting; 16 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/MarketInformationManagement.yaml)

### Service Domain: Financial Market Analysis

**Path:** Channels › Information Providers › Financial Market Analysis  
**BIAN id:** `40353`  
**Business Area:** Channels  
**Business Domain:** Information Providers

**What it does.** Provide different types of financial market analysis using available financial market information and research

**API.** Published as `FinancialMarketAnalysis.yaml` (OpenAPI 3 and AsyncAPI 3) — control record FinancialMarketAnalysis; behavior qualifiers FinancialMarketInsight; 10 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/FinancialMarketAnalysis.yaml)

### Service Domain: Market Data Switch Operation

**Path:** Channels › Information Providers › Market Data Switch Operation  
**BIAN id:** `42536`  
**Business Area:** Channels  
**Business Domain:** Information Providers

**What it does.** This service domain operates the internal information distribution facility/switch in compliance with administered external subscription information feed service access rights. Note the content is retrieved by the Market Feed Operation service domain from the various external feed services. Internal information can also be published over the switch from various bank sources (such as bank rates provided by treasury).

**API.** Published as `MarketDataSwitchOperation.yaml` (OpenAPI 3 and AsyncAPI 3) — control record InformationFeedSwitchOperatingSession; behavior qualifiers Distribution, FeedUpload, InternalPublication; 18 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/MarketDataSwitchOperation.yaml)

### Service Domain: Financial Market Research

**Path:** Channels › Information Providers › Financial Market Research  
**BIAN id:** `44259`  
**Business Area:** Channels  
**Business Domain:** Information Providers

**What it does.** The service domain consolidates external financial market research

**API.** Published as `FinancialMarketResearch.yaml` (OpenAPI 3 and AsyncAPI 3) — control record FinancialMarketResearchDirectoryEntry; 5 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/FinancialMarketResearch.yaml)

### Service Domain: Public Reference Data Management

**Path:** Channels › Information Providers › Public Reference Data Management  
**BIAN id:** `44898`  
**Business Area:** Channels  
**Business Domain:** Information Providers

**What it does.** Provide structured access to standard 'global' reference data and definitions associated with market activity such as currency, country and segment identifiers.

**API.** Published as `PublicReferenceDataManagement.yaml` (OpenAPI 3 and AsyncAPI 3) — control record GlobalStandardSpecification; behavior qualifiers GlobalReferenceData; 9 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/PublicReferenceDataManagement.yaml)

### Service Domain: Information Provider Operation

**Path:** Channels › Information Providers › Information Provider Operation  
**BIAN id:** `47062`  
**Business Area:** Channels  
**Business Domain:** Information Providers

**API.** Published as `InformationProviderOperation.yaml` (OpenAPI 3 and AsyncAPI 3) — control record InformationFeedOperatingSession; 8 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/InformationProviderOperation.yaml)

## Business Domain: Cross Channel

`146482` — part of the Channels Business Area. Contains 10 Service Domains: Contact Routing, Channel Activity History, Session Dialogue, Party Routing Profile, Processing Order, Contact Handler, Party Authentication, Customer Access Entitlement, Transaction Authorization, Customer Workbench.

### Service Domain: Contact Routing

**Path:** Channels › Cross Channel › Contact Routing  
**BIAN id:** `30875`  
**Business Area:** Channels  
**Business Domain:** Cross Channel

**What it does.** The Contact Routing service domain tracks servicing resource availability and uses any known details about the customer contact (e.g. identity, indicated purpose of call, status of the relationship) to make an optimal routing decision. The routing selection may include matching the required product knowledge/skills to the available servicing resources.

**API.** Published as `ContactRouting.yaml` (OpenAPI 3 and AsyncAPI 3) — control record CustomerServicingResourceAllocation; behavior qualifiers Allocation; 12 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/ContactRouting.yaml)

### Service Domain: Channel Activity History

**Path:** Channels › Cross Channel › Channel Activity History  
**BIAN id:** `31040`  
**Business Area:** Channels  
**Business Domain:** Cross Channel

**What it does.** This service domains consolidates and captures customer channel usage activity to support channel activity analysis and also can be referenced for customer access authorization and routing decisions

**API.** Published as `ChannelActivityHistory.yaml` (OpenAPI 3 and AsyncAPI 3) — control record ChannelActivityLog; behavior qualifiers Event; 7 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/ChannelActivityHistory.yaml)

### Service Domain: Session Dialogue

**Path:** Channels › Cross Channel › Session Dialogue  
**BIAN id:** `32006`  
**Business Area:** Channels  
**Business Domain:** Cross Channel

**What it does.** This service domain handles/structures the customer narrative during an interactive session. It consolidates and presents pertinent customer information and provides servicing guidelines with standard dialogue/scripting as appropriate. It can include the capability to provoke questions to capture key relationship and sales triggers. It also ensures the correct sequencing, dialogue content and actions are performed/initiated during the customer interaction. It may further leverage the session by passing on customer notifications, status updates and triggering sales/marketing efforts.

**API.** Published as `SessionDialogue.yaml` (OpenAPI 3 and AsyncAPI 3) — control record CustomerContactSessionProcedure; behavior qualifiers Authentication, Case, History, Intelligence, Offer, Order, ProductorService, Query, Sales; 35 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/SessionDialogue.yaml)

### Service Domain: Party Routing Profile

**Path:** Channels › Cross Channel › Party Routing Profile  
**BIAN id:** `34927`  
**Business Area:** Channels  
**Business Domain:** Cross Channel

**What it does.** This service domain maintains a small profile of key indicators for a customer that is referenced during customer interactions to facilitate routing, servicing and product/service fulfillment decisions. This can include status (such as account in arrears), ratings (such as high value customer) and alerts (such possible fraud activity detected)

**API.** Published as `PartyRoutingProfile.yaml` (OpenAPI 3 and AsyncAPI 3) — control record PartyState; behavior qualifiers Alert, Rating, Status; 18 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/PartyRoutingProfile.yaml)

### Service Domain: Processing Order

**Path:** Channels › Cross Channel › Processing Order  
**BIAN id:** `38581`  
**Business Area:** Channels  
**Business Domain:** Cross Channel

**What it does.** The Processing Order Service Domain handles the processing of a service request that comes in via a secure channel from a known requestor, which is typically an automated process itself and not a customer.

**API.** Published as `ProcessingOrder.yaml` (OpenAPI 3 and AsyncAPI 3) — control record ProcessingOrderProcedure; 8 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/ProcessingOrder.yaml)

### Service Domain: Contact Handler

**Path:** Channels › Cross Channel › Contact Handler  
**BIAN id:** `38799`  
**Business Area:** Channels  
**Business Domain:** Cross Channel

**What it does.** This service domain handles a customer's interactive contact with the bank. This will typically involve launching of one or more channel/device specific dialogue sessions as necessary within the customer contact

**API.** Published as `ContactHandler.yaml` (OpenAPI 3 and AsyncAPI 3) — control record CustomerContactOperatingSession; behavior qualifiers Authentication, History, Routing, Session; 16 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/ContactHandler.yaml)

### Service Domain: Party Authentication

**Path:** Channels › Cross Channel › Party Authentication  
**BIAN id:** `38917`  
**Business Area:** Channels  
**Business Domain:** Cross Channel

**What it does.** This service domain provides a customer identify authentication service covering all channels and devices to support access to the banks products and services

**API.** Published as `PartyAuthentication.yaml` (OpenAPI 3 and AsyncAPI 3) — control record PartyAuthenticationAssessment; behavior qualifiers Behavior, Biometric, Device, Document, Password, Question; 19 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/PartyAuthentication.yaml)

### Service Domain: Customer Access Entitlement

**Path:** Channels › Cross Channel › Customer Access Entitlement  
**BIAN id:** `43057`  
**Business Area:** Channels  
**Business Domain:** Cross Channel

**What it does.** This service domain maintains the details of the allowed channel/device based access to products and services that the customer has in place. This profile is referenced in servicing and fulfillment activity and may include customer preferences and access limits/constraints that span multiple products.

**API.** Published as `CustomerAccessEntitlement.yaml` (OpenAPI 3 and AsyncAPI 3) — control record CustomerAccessProfileAgreement; behavior qualifiers Preferences, Restrictions; 13 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/CustomerAccessEntitlement.yaml)

### Service Domain: Transaction Authorization

**Path:** Channels › Cross Channel › Transaction Authorization  
**BIAN id:** `43343`  
**Business Area:** Channels  
**Business Domain:** Cross Channel

**What it does.** This service domain handles risk based authorization for interactive customer transactions. This combines the context (channel) transaction, customer details and recent activity analysis as appropriate. The authorization may require a specific level of party/customer authentication to get approval.

**API.** Published as `TransactionAuthorization.yaml` (OpenAPI 3 and AsyncAPI 3) — control record InteractiveTransactionAssessment; 7 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/TransactionAuthorization.yaml)

### Service Domain: Customer Workbench

**Path:** Channels › Cross Channel › Customer Workbench  
**BIAN id:** `44851`  
**Business Area:** Channels  
**Business Domain:** Cross Channel

**What it does.** This service domain represents customer side devices. Most commonly providing a customer access portal to the banks products and services through any suitable channel and device

**API.** Published as `CustomerWorkbench.yaml` (OpenAPI 3 and AsyncAPI 3) — control record CustomerWorkbenchOperatingSession; behavior qualifiers Broadcast, Browsing, Contact, ProductandServiceAccess, SWUpdate; 23 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/CustomerWorkbench.yaml)

## Business Domain: Channel Specific

`146475` — part of the Channels Business Area. Contains 7 Service Domains: Financial Gateway, Card Terminal Operation, eBranch Operations, ATM Network Operations, Advanced Voice Services Operations, Branch Location Operations, Card Terminal Administration.

### Service Domain: Financial Gateway

**Path:** Channels › Channel Specific › Financial Gateway  
**BIAN id:** `30542`  
**Business Area:** Channels  
**Business Domain:** Channel Specific

**What it does.** This service domain operates automated message interfaces to secure networks such as SWIFT, TELEX, ACH and Financial Market/Exchange reporting services

**API.** Published as `FinancialGateway.yaml` (OpenAPI 3 and AsyncAPI 3) — control record FinancialGatewayOperatingSession; behavior qualifiers Inbound, Outbound; 9 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/FinancialGateway.yaml)

### Service Domain: Card Terminal Operation

**Path:** Channels › Channel Specific › Card Terminal Operation  
**BIAN id:** `32892`  
**Business Area:** Channels  
**Business Domain:** Channel Specific

**What it does.** This service domain handle POS operations including processing, capture and tracking of the transactions originating at the Point of Sale devices.

**API.** Published as `CardTerminalOperation.yaml` (OpenAPI 3 and AsyncAPI 3) — control record CardPOSNetworkOperatingSession; behavior qualifiers Authorization, Batch, Capture; 15 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/CardTerminalOperation.yaml)

### Service Domain: eBranch Operations

**Path:** Channels › Channel Specific › eBranch Operations  
**BIAN id:** `34919`  
**Business Area:** Channels  
**Business Domain:** Channel Specific

**What it does.** This service domain operates the bank's on-line web based electronic branch capabilities - controlling access and load balancing across available communications and processing resources to optimize performance/availability

**API.** Published as `eBranchOperations.yaml` (OpenAPI 3 and AsyncAPI 3) — control record eBranchChannelOperatingSession; behavior qualifiers Inbound, Outbound; 9 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/eBranchOperations.yaml)

### Service Domain: ATM Network Operations

**Path:** Channels › Channel Specific › ATM Network Operations  
**BIAN id:** `40552`  
**Business Area:** Channels  
**Business Domain:** Channel Specific

**What it does.** Handling the automated operation of the ATM network and linked devices, including tracing physical cash and document movements

**API.** Published as `ATMNetworkOperations.yaml` (OpenAPI 3 and AsyncAPI 3) — control record ATMNetworkOperatingSession; behavior qualifiers CashDistribution, DeviceTracking, FinancialDocumentHandling, FinancialTransactionCapture, NetworkOperation; 28 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/ATMNetworkOperations.yaml)

### Service Domain: Advanced Voice Services Operations

**Path:** Channels › Channel Specific › Advanced Voice Services Operations  
**BIAN id:** `43031`  
**Business Area:** Channels  
**Business Domain:** Channel Specific

**What it does.** This service domain operates the telephone channel infrastructure, including the IVR and any other automated devices as appropriate. This includes handling default routing rules and intra-day/session adjustments to deal with peak load or other operational variations

**API.** Published as `AdvancedVoiceServicesOperations.yaml` (OpenAPI 3 and AsyncAPI 3) — control record VoiceChannelOperatingSession; behavior qualifiers Inbound, Outbound; 9 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/AdvancedVoiceServicesOperations.yaml)

### Service Domain: Branch Location Operations

**Path:** Channels › Channel Specific › Branch Location Operations  
**BIAN id:** `43602`  
**Business Area:** Channels  
**Business Domain:** Channel Specific

**What it does.** The day to day administration of branch activity, including teller assignment and cash handling oversight

**API.** Published as `BranchLocationOperations.yaml` (OpenAPI 3 and AsyncAPI 3) — control record BranchLocationAdministrativePlan; behavior qualifiers CashInventoryHandling; 14 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/BranchLocationOperations.yaml)

### Service Domain: Card Terminal Administration

**Path:** Channels › Channel Specific › Card Terminal Administration  
**BIAN id:** `44637`  
**Business Area:** Channels  
**Business Domain:** Channel Specific

**What it does.** This service domain administers the POS Network including the inventory, terminal characteristics, deployment and status of the POS devices.

**API.** Published as `CardTerminalAdministration.yaml` (OpenAPI 3 and AsyncAPI 3) — control record CardPOSDeviceAllocation; behavior qualifiers Allocation; 11 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/CardTerminalAdministration.yaml)

## Business Domain: Distribution

`146485` — part of the Channels Business Area. Contains 3 Service Domains: Branch Currency Distribution, Product Inventory Distribution, Correspondence.

### Service Domain: Branch Currency Distribution

**Path:** Channels › Distribution › Branch Currency Distribution  
**BIAN id:** `29445`  
**Business Area:** Channels  
**Business Domain:** Distribution

**What it does.** Schedule and coordinate the secure distribution of cash inventory across the branch and ATM networks.

**API.** Published as `BranchCurrencyDistribution.yaml` (OpenAPI 3 and AsyncAPI 3) — control record CashDistributionProcedure; behavior qualifiers DistributionPlanning, DistributionVehicleAdministration, InventoryDistributionOversight, InventoryProvisioning; 21 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/BranchCurrencyDistribution.yaml)

### Service Domain: Product Inventory Distribution

**Path:** Channels › Distribution › Product Inventory Distribution  
**BIAN id:** `32234`  
**Business Area:** Channels  
**Business Domain:** Distribution

**What it does.** Administer the provisioning and distribution of product inventory across the branch network and/or distribute direct to customers (e.g. mail) where appropriate

**API.** Published as `ProductInventoryDistribution.yaml` (OpenAPI 3 and AsyncAPI 3) — control record ProductInventoryDistributionAdministrativePlan; behavior qualifiers Distribution, Mailing, Oversight, Provisioning; 24 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/ProductInventoryDistribution.yaml)

### Service Domain: Correspondence

**Path:** Channels › Distribution › Correspondence  
**BIAN id:** `35764`  
**Business Area:** Channels  
**Business Domain:** Distribution

**What it does.** This service domain orchestrates the production of pre-formatted correspondence and batches of correspondence (e.g. mail shots).

**API.** Published as `Correspondence.yaml` (OpenAPI 3 and AsyncAPI 3) — control record CorrespondenceOperatingSession; behavior qualifiers BlockMailing, Inbound, Outbound, OutboundWithResponse; 18 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/Correspondence.yaml)

## Business Domain: Servicing

`39477` — part of the Channels Business Area. Contains 6 Service Domains: Servicing Issue, Point of Service, Service Directory, Interactive Help, Contact Center Operations, Servicing Event History.

### Service Domain: Servicing Issue

**Path:** Channels › Servicing › Servicing Issue  
**BIAN id:** `30958`  
**Business Area:** Channels  
**Business Domain:** Servicing

**What it does.** This Service Domain handles production customer servicing issues detected in the customer servicing environment

**API.** Published as `ServicingIssue.yaml` (OpenAPI 3 and AsyncAPI 3) — control record ServicingIssueProcedure; behavior qualifiers ProductionIssueAnalysis, ProductionIssueDetermination, ProductionIssueResolution; 29 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/ServicingIssue.yaml)

### Service Domain: Point of Service

**Path:** Channels › Servicing › Point of Service  
**BIAN id:** `38007`  
**Business Area:** Channels  
**Business Domain:** Servicing

**What it does.** This service domain operates servicing positions within the bank. It administers all media connections, inventory holdings (e.g. cash), provides access to support utilities and tracks servicing activity -e.g. time spent, activity logs, capturing servicing events including commission and training related actions. In cases servicing positions can be automated

**API.** Published as `PointofService.yaml` (OpenAPI 3 and AsyncAPI 3) — control record PointofServiceOperatingSession; behavior qualifiers Assisted, Automated, CashPosition, Interaction, Inventory; 23 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/PointofService.yaml)

### Service Domain: Service Directory

**Path:** Channels › Servicing › Service Directory  
**BIAN id:** `38618`  
**Business Area:** Channels  
**Business Domain:** Servicing

**What it does.** This Service Domain presents a structured set of services that the customer can select from

**API.** Published as `ServiceDirectory.yaml` (OpenAPI 3 and AsyncAPI 3) — control record ServiceDirectoryEntry; behavior qualifiers AccessControlServicing, ArrangementServicing, ProductAccessServicing, RelationshipServicing, SalesServicing, ServiceDeliveryServicing; 43 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/ServiceDirectory.yaml)

### Service Domain: Interactive Help

**Path:** Channels › Servicing › Interactive Help  
**BIAN id:** `45233`  
**Business Area:** Channels  
**Business Domain:** Servicing

**What it does.** Operate the automated facility that provides interactive context sensitive servicing guidance to employees and self-serve customers

**API.** Published as `InteractiveHelp.yaml` (OpenAPI 3 and AsyncAPI 3) — behavior qualifiers HelpServiceSelection; 4 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/InteractiveHelp.yaml)

### Service Domain: Contact Center Operations

**Path:** Channels › Servicing › Contact Center Operations  
**BIAN id:** `46007`  
**Business Area:** Channels  
**Business Domain:** Servicing

**What it does.** Administer the day to day activity in the contact center - allocate positions and track staff availability and performance

**API.** Published as `ContactCenterOperations.yaml` (OpenAPI 3 and AsyncAPI 3) — control record ContactCenterAdministrativePlan; behavior qualifiers Assignment, PeakLoad, Troubleshooting; 18 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/ContactCenterOperations.yaml)

### Service Domain: Servicing Event History

**Path:** Channels › Servicing › Servicing Event History  
**BIAN id:** `46487`  
**Business Area:** Channels  
**Business Domain:** Servicing

**What it does.** This service domain captures, classifies and stores servicing activity and events to support root cause analysis

**API.** Published as `ServicingEventHistory.yaml` (OpenAPI 3 and AsyncAPI 3) — control record ServicingEventLog; behavior qualifiers Assignment, Issue, ServicingFacility, Session; 16 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/ServicingEventHistory.yaml)
