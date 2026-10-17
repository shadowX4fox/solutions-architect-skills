# BIAN Service Landscape v14.0.0 — Business Area: Business Development

This document covers **one** of the eight BIAN Business Areas: **Business Development** (model id `146473`). It contains 6 Business Domains and 58 Service Domains, 41 of which have a published semantic API.

The eight BIAN Business Areas are: Business Management, Resource Management, Finance And Risk Management, Operations, Products, Customers, Channels, and Business Development. Service Domains belonging to the other seven areas are documented in their own files.

Each Service Domain below states its path, BIAN id and published API. Where an API exists, **What it does.** is that API's own one-line description, from BIAN's semantic API repository (Apache License 2.0). The Service Landscape's role definitions and examples of use are © BIAN and are not bundled: an institution pack supplies the full text (docs/INSTITUTION_PACKS.md).

Source: the taxonomy of the BIAN Service Landscape V14.0 Value Chain View; API descriptions from github.com/bian-official/public (Apache License 2.0).

---

## Business Domain: Marketing And Development

`31837` — part of the Business Development Business Area. Contains 16 Service Domains: Market Research, Customer Campaign Management, Segment Direction, Prospect Campaign Management, Customer Surveys, Contribution Analysis, Brand Management, Advertising, Sales Planning, Market Analysis, Customer Portfolio, Business Development, Competitor Analysis, Customer Campaign Design, Prospect Campaign Design, Promotional Events.

### Service Domain: Market Research

**Path:** Business Development › Marketing And Development › Market Research  
**BIAN id:** `30172`  
**Business Area:** Business Development  
**Business Domain:** Marketing And Development

**What it does.** This service domain handles the capture of market research from multiple external sources. This can include live feeds, analysis and reports in any form. The information is classified/catalogued and stored for retrieval.

**API.** Published as `MarketResearch.yaml` (OpenAPI 3 and AsyncAPI 3) — control record GeneralMarketResearchDirectoryEntry; 5 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/MarketResearch.yaml)

### Service Domain: Customer Campaign Management

**Path:** Business Development › Marketing And Development › Customer Campaign Management  
**BIAN id:** `30911`  
**Business Area:** Business Development  
**Business Domain:** Marketing And Development

**What it does.** Assess the coverage and impact of internal/customer campaigns and redirect campaign development and execution activity accordingly

**API.** Published as `CustomerCampaignManagement.yaml` (OpenAPI 3 and AsyncAPI 3) — control record CustomerCampaignPortfolioManagementPlan; behavior qualifiers CampaignDirection, MarketTracking, PerformanceAssessment; 18 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/CustomerCampaignManagement.yaml)

### Service Domain: Segment Direction

**Path:** Business Development › Marketing And Development › Segment Direction  
**BIAN id:** `32492`  
**Business Area:** Business Development  
**Business Domain:** Marketing And Development

**What it does.** Define market segments and develop and assess performance against the segment plan's performance goals

**API.** Published as `SegmentDirection.yaml` (OpenAPI 3 and AsyncAPI 3) — control record SegmentStrategy; behavior qualifiers Initiative; 13 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/SegmentDirection.yaml)

### Service Domain: Prospect Campaign Management

**Path:** Business Development › Marketing And Development › Prospect Campaign Management  
**BIAN id:** `33231`  
**Business Area:** Business Development  
**Business Domain:** Marketing And Development

**What it does.** Assess the coverage and impact of external/prospect campaigns and redirect campaign development and execution activity accordingly

**API.** Published as `ProspectCampaignManagement.yaml` (OpenAPI 3 and AsyncAPI 3) — control record ProspectCampaignPortfolioManagementPlan; behavior qualifiers CampaignDirection, MarketTracking, PerformanceAssessment; 18 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/ProspectCampaignManagement.yaml)

### Service Domain: Customer Surveys

**Path:** Business Development › Marketing And Development › Customer Surveys  
**BIAN id:** `33494`  
**Business Area:** Business Development  
**Business Domain:** Marketing And Development

**What it does.** Define and execute and analyze customer surveys

**API.** Published as `CustomerSurveys.yaml` (OpenAPI 3 and AsyncAPI 3) — 0 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/CustomerSurveys.yaml)

### Service Domain: Contribution Analysis

**Path:** Business Development › Marketing And Development › Contribution Analysis  
**BIAN id:** `36798`  
**Business Area:** Business Development  
**Business Domain:** Marketing And Development

**API.** No semantic API published for this Service Domain in BIAN release 14.0.0.

### Service Domain: Brand Management

**Path:** Business Development › Marketing And Development › Brand Management  
**BIAN id:** `37174`  
**Business Area:** Business Development  
**Business Domain:** Marketing And Development

**What it does.** Respond to events that potentially damage the brand or provide an opportunity to strengthen/leverage brand awareness

**API.** Published as `BrandManagement.yaml` (OpenAPI 3 and AsyncAPI 3) — control record BrandManagementPlan; behavior qualifiers BrandAdvice, Troubleshooting; 13 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/BrandManagement.yaml)

### Service Domain: Advertising

**Path:** Business Development › Marketing And Development › Advertising  
**BIAN id:** `37520`  
**Business Area:** Business Development  
**Business Domain:** Marketing And Development

**What it does.** Develop the plan for and oversee advertising campaign activity, including budget and resource management

**API.** Published as `Advertising.yaml` (OpenAPI 3 and AsyncAPI 3) — control record AdvertisingCampaignManagementPlan; behavior qualifiers CampaignDirection, MarketTracking, PerformanceAssessment; 18 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/Advertising.yaml)

### Service Domain: Sales Planning

**Path:** Business Development › Marketing And Development › Sales Planning  
**BIAN id:** `37530`  
**Business Area:** Business Development  
**Business Domain:** Marketing And Development

**API.** No semantic API published for this Service Domain in BIAN release 14.0.0.

### Service Domain: Market Analysis

**Path:** Business Development › Marketing And Development › Market Analysis  
**BIAN id:** `38574`  
**Business Area:** Business Development  
**Business Domain:** Marketing And Development

**What it does.** This service domain analyzes internal and external market information sources as necessary to develop specific market insights. It may maintain a collection of predefined market analyses and may also offer specific ad-hoc analysis on request

**API.** Published as `MarketAnalysis.yaml` (OpenAPI 3 and AsyncAPI 3) — control record GeneralMarketResearchAnalysis; behavior qualifiers CompetitiveAnalysis; 5 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/MarketAnalysis.yaml)

### Service Domain: Customer Portfolio

**Path:** Business Development › Marketing And Development › Customer Portfolio  
**BIAN id:** `38858`  
**Business Area:** Business Development  
**Business Domain:** Marketing And Development

**What it does.** Maintain a portfolio of analytical views of the customer base to support customer segment profitability and performance analysis

**API.** Published as `CustomerPortfolio.yaml` (OpenAPI 3 and AsyncAPI 3) — control record CustomerPortfolioAnalysis; behavior qualifiers PerformanceAnalysis; 10 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/CustomerPortfolio.yaml)

### Service Domain: Business Development

**Path:** Business Development › Marketing And Development › Business Development  
**BIAN id:** `39323`  
**Business Area:** Business Development  
**Business Domain:** Marketing And Development

**What it does.** Define, implement, track and assess the new business development plans

**API.** Published as `BusinessDevelopment.yaml` (OpenAPI 3 and AsyncAPI 3) — control record BusinessDevelopmentStrategy; 7 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/BusinessDevelopment.yaml)

### Service Domain: Competitor Analysis

**Path:** Business Development › Marketing And Development › Competitor Analysis  
**BIAN id:** `42330`  
**Business Area:** Business Development  
**Business Domain:** Marketing And Development

**What it does.** Solicit, consolidate and analyze competitor specific public domain data to develop competitor insights and comparisons

**API.** Published as `CompetitorAnalysis.yaml` (OpenAPI 3 and AsyncAPI 3) — control record CompetitorAnalysis; behavior qualifiers ProductCompetitiveAnalysis; 6 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/CompetitorAnalysis.yaml)

### Service Domain: Customer Campaign Design

**Path:** Business Development › Marketing And Development › Customer Campaign Design  
**BIAN id:** `43665`  
**Business Area:** Business Development  
**Business Domain:** Marketing And Development

**What it does.** Design and refine customer campaign specifications based on their impact

**API.** Published as `CustomerCampaignDesign.yaml` (OpenAPI 3 and AsyncAPI 3) — control record CustomerCampaignSpecification; 8 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/CustomerCampaignDesign.yaml)

### Service Domain: Prospect Campaign Design

**Path:** Business Development › Marketing And Development › Prospect Campaign Design  
**BIAN id:** `45886`  
**Business Area:** Business Development  
**Business Domain:** Marketing And Development

**What it does.** Design and refine prospect campaign specifications based on their impact

**API.** Published as `ProspectCampaignDesign.yaml` (OpenAPI 3 and AsyncAPI 3) — control record ProspectCampaignSpecification; 8 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/ProspectCampaignDesign.yaml)

### Service Domain: Promotional Events

**Path:** Business Development › Marketing And Development › Promotional Events  
**BIAN id:** `49505`  
**Business Area:** Business Development  
**Business Domain:** Marketing And Development

**What it does.** Develop the plan for and oversee promotional event activity, including budget and resource management

**API.** Published as `PromotionalEvents.yaml` (OpenAPI 3 and AsyncAPI 3) — control record PromotionalEventManagementPlan; behavior qualifiers ImpactAssessment, MarketTracking, Participation; 18 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/PromotionalEvents.yaml)

## Business Domain: Product Management

`30269` — part of the Business Development Business Area. Contains 9 Service Domains: Product Portfolio, Product Quality Assurance, Product Directory, Product Design, Product Training, Case Root Cause Analysis, Product Deployment, Production Release, Discount Pricing.

### Service Domain: Product Portfolio

**Path:** Business Development › Product Management › Product Portfolio  
**BIAN id:** `29963`  
**Business Area:** Business Development  
**Business Domain:** Product Management

**What it does.** Maintain a portfolio of analytical views of the product portfolio to support product profitability and performance analysis

**API.** Published as `ProductPortfolio.yaml` (OpenAPI 3 and AsyncAPI 3) — control record ProductPortfolioAnalysis; behavior qualifiers PerformanceAnalysis; 10 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/ProductPortfolio.yaml)

### Service Domain: Product Quality Assurance

**Path:** Business Development › Product Management › Product Quality Assurance  
**BIAN id:** `32266`  
**Business Area:** Business Development  
**Business Domain:** Product Management

**What it does.** Maintain and execute a portfolio of product quality assurance tests and certifications that can be applied to evaluate any aspect of production activity for quality assurance

**API.** Published as `ProductQualityAssurance.yaml` (OpenAPI 3 and AsyncAPI 3) — control record ProductandServiceAssessment; behavior qualifiers FunctionalConsistencyChecks, ProcessingErrorandIntegrityChecks, ResiliencyandPerformanceChecks, UsabilityChecks; 19 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/ProductQualityAssurance.yaml)

### Service Domain: Product Directory

**Path:** Business Development › Product Management › Product Directory  
**BIAN id:** `32532`  
**Business Area:** Business Development  
**Business Domain:** Product Management

**What it does.** This service domain maintains a comprehensive directory of the bank's products and services. It can be referenced to obtain product details used to support activities including product selection, sales and marketing, on-boarding, servicing and product fulfillment.

**API.** Published as `ProductDirectory.yaml` (OpenAPI 3 and AsyncAPI 3) — control record ProductDirectoryEntry; behavior qualifiers Operations, Production, SalesandMarketing, Servicing; 16 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/ProductDirectory.yaml)

### Service Domain: Product Design

**Path:** Business Development › Product Management › Product Design  
**BIAN id:** `32833`  
**Business Area:** Business Development  
**Business Domain:** Product Management

**What it does.** Develop/refine product designs and supporting specification details

**API.** Published as `ProductDesign.yaml` (OpenAPI 3 and AsyncAPI 3) — control record ProductorServiceSpecification; behavior qualifiers FunctionalRequirements, Production, Testing; 15 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/ProductDesign.yaml)

### Service Domain: Product Training

**Path:** Business Development › Product Management › Product Training  
**BIAN id:** `34291`  
**Business Area:** Business Development  
**Business Domain:** Product Management

**What it does.** Develop and provide product specific training across the workforce. This includes all media and training mechanisms (on-line, self taught, classroom etc.)

**API.** Published as `ProductTraining.yaml` (OpenAPI 3 and AsyncAPI 3) — control record ProductTrainingProcedure; behavior qualifiers ContentDevelopment, ServiceDelivery, ServiceEvaluation, ServiceScheduling; 28 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/ProductTraining.yaml)

### Service Domain: Case Root Cause Analysis

**Path:** Business Development › Product Management › Case Root Cause Analysis  
**BIAN id:** `39622`  
**Business Area:** Business Development  
**Business Domain:** Product Management

**What it does.** Root cause analysis business function reviews case reports to identify possible improvements to eliminate/mitigate servicing issues

**API.** Published as `CaseRootCauseAnalysis.yaml` (OpenAPI 3 and AsyncAPI 3) — control record CustomerCaseRootCauseAnalysis; behavior qualifiers CreditandFraudRelatedIssueAnalysis, OperationsandServicingIssueAnalysis, ProductandServiceIssueAnalysis; 20 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/CaseRootCauseAnalysis.yaml)

### Service Domain: Product Deployment

**Path:** Business Development › Product Management › Product Deployment  
**BIAN id:** `41581`  
**Business Area:** Business Development  
**Business Domain:** Product Management

**What it does.** Plan and administer the production deployment new and updated products and services

**API.** Published as `ProductDeployment.yaml` (OpenAPI 3 and AsyncAPI 3) — control record ProductandServiceDeploymentDevelopment; behavior qualifiers HROperations, ITOperations, Production, ProductionSupport, SalesandMarketing, Servicing, Systems; 36 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/ProductDeployment.yaml)

### Service Domain: Production Release

**Path:** Business Development › Product Management › Production Release  
**BIAN id:** `44493`  
**Business Area:** Business Development  
**Business Domain:** Product Management

**What it does.** Maintain and apply production release tests for new and updated systems

**API.** Published as `ProductionRelease.yaml` (OpenAPI 3 and AsyncAPI 3) — control record ProductionSystemAssessment; behavior qualifiers BusinessRisk, FunctionalRisk, OperationalRisk, ProductionRisk; 14 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/ProductionRelease.yaml)

### Service Domain: Discount Pricing

**Path:** Business Development › Product Management › Discount Pricing  
**BIAN id:** `45736`  
**Business Area:** Business Development  
**Business Domain:** Product Management

**API.** No semantic API published for this Service Domain in BIAN release 14.0.0.

## Business Domain: Solution Development

`48386` — part of the Business Development Business Area. Contains 4 Service Domains: IT Standards And Guidelines, System Development, Development Environment, Systems Administration.

### Service Domain: IT Standards And Guidelines

**Path:** Business Development › Solution Development › IT Standards And Guidelines  
**BIAN id:** `42048`  
**Business Area:** Business Development  
**Business Domain:** Solution Development

**What it does.** Define and apply comprehensive IT architectures, policies and standards as appropriate. Also define the IT usage guidelines and procedures governing systems use across the enterprise

**API.** Published as `ITStandardsAndGuidelines.yaml` (OpenAPI 3 and AsyncAPI 3) — control record TechnologyStandardsSpecification; behavior qualifiers DevelopmentToolingandEnvironment, ITPoliciesandGuidelines, ProductTestingandDeploymentMechanisms, ProductionEnvironmentandSupportServices, ProductionPlatformsandInfrastructure; 37 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/ITStandardsAndGuidelines.yaml)

### Service Domain: System Development

**Path:** Business Development › Solution Development › System Development  
**BIAN id:** `48176`  
**Business Area:** Business Development  
**Business Domain:** Solution Development

**What it does.** Develop new, enhance existing applications and integrate package based systems solutions

**API.** Published as `SystemDevelopment.yaml` (OpenAPI 3 and AsyncAPI 3) — control record ITSystemDevelopment; behavior qualifiers FunctionalSpecification, SoftwareandDataSpecification, TechnicalSpecification, TestingSpecification, UsageSpecification; 31 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/SystemDevelopment.yaml)

### Service Domain: Development Environment

**Path:** Business Development › Solution Development › Development Environment  
**BIAN id:** `48208`  
**Business Area:** Business Development  
**Business Domain:** Solution Development

**API.** No semantic API published for this Service Domain in BIAN release 14.0.0.

### Service Domain: Systems Administration

**Path:** Business Development › Solution Development › Systems Administration  
**BIAN id:** `49098`  
**Business Area:** Business Development  
**Business Domain:** Solution Development

**What it does.** Administer the configuration, maintenance, assignment and track usage and status of all IT assets deployed in development and production across the enterprise

**API.** Published as `SystemsAdministration.yaml` (OpenAPI 3 and AsyncAPI 3) — control record ITSystemAdministrativePlan; behavior qualifiers Assurance, CapacityPlanningandResilience, Configuration, Inventory; 24 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/SystemsAdministration.yaml)

## Business Domain: Channel Management

`33467` — part of the Business Development Business Area. Contains 16 Service Domains: Market Data Switch Administration, Branch Portfolio, Advanced Voice Services Management, eBranch Management, Information Provider Administration, Channel Activity Analysis, Central Cash Handling, Financial Message Analysis, Branch Location Management, Channel Portfolio, Branch Network Management, Branch Currency Management, Contact Center Management, Servicing Activity Analysis, Product Inventory Item Management, ATM Network Management.

### Service Domain: Market Data Switch Administration

**Path:** Business Development › Channel Management › Market Data Switch Administration  
**BIAN id:** `28751`  
**Business Area:** Business Development  
**Business Domain:** Channel Management

**API.** No semantic API published for this Service Domain in BIAN release 14.0.0.

### Service Domain: Branch Portfolio

**Path:** Business Development › Channel Management › Branch Portfolio  
**BIAN id:** `29195`  
**Business Area:** Business Development  
**Business Domain:** Channel Management

**API.** No semantic API published for this Service Domain in BIAN release 14.0.0.

### Service Domain: Advanced Voice Services Management

**Path:** Business Development › Channel Management › Advanced Voice Services Management  
**BIAN id:** `29475`  
**Business Area:** Business Development  
**Business Domain:** Channel Management

**What it does.** Oversee the configuration and operation of the voice channel facilities

**API.** Published as `AdvancedVoiceServicesManagement.yaml` (OpenAPI 3 and AsyncAPI 3) — control record VoiceChannelManagementPlan; behavior qualifiers CapacityPlanning, MaintenanceAndUpgrades, Troubleshooting; 15 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/AdvancedVoiceServicesManagement.yaml)

### Service Domain: eBranch Management

**Path:** Business Development › Channel Management › eBranch Management  
**BIAN id:** `32275`  
**Business Area:** Business Development  
**Business Domain:** Channel Management

**What it does.** Oversee the configuration and operation of the e-branch channel facilities

**API.** Published as `eBranchManagement.yaml` (OpenAPI 3 and AsyncAPI 3) — control record eBranchChannelManagementPlan; behavior qualifiers CapacityPlanning, MaintenanceAndUpgrades, Troubleshooting; 15 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/eBranchManagement.yaml)

### Service Domain: Information Provider Administration

**Path:** Business Development › Channel Management › Information Provider Administration  
**BIAN id:** `32920`  
**Business Area:** Business Development  
**Business Domain:** Channel Management

**API.** No semantic API published for this Service Domain in BIAN release 14.0.0.

### Service Domain: Channel Activity Analysis

**Path:** Business Development › Channel Management › Channel Activity Analysis  
**BIAN id:** `34813`  
**Business Area:** Business Development  
**Business Domain:** Channel Management

**What it does.** This service domain tracks and analyzes channel activity to support relationship development, to detect unwanted behavior, possible fraud, and to constrain channel use as necessary (for example tracking usage frequency and cumulative transaction amounts within a period)

**API.** Published as `ChannelActivityAnalysis.yaml` (OpenAPI 3 and AsyncAPI 3) — control record ChannelActivityAnalysis; behavior qualifiers Bot, CustomerBehavior, CustomerFraud, DeviceError, MerchantBehavior, MerchantFraud; 16 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/ChannelActivityAnalysis.yaml)

### Service Domain: Central Cash Handling

**Path:** Business Development › Channel Management › Central Cash Handling  
**BIAN id:** `34826`  
**Business Area:** Business Development  
**Business Domain:** Channel Management

**What it does.** Track cash inventory, project demand and allocate inventory across the branch/ATM network

**API.** Published as `CentralCashHandling.yaml` (OpenAPI 3 and AsyncAPI 3) — control record CentralCashAllocation; behavior qualifiers ProjectionandAllocation, TrackingandAllocation; 18 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/CentralCashHandling.yaml)

### Service Domain: Financial Message Analysis

**Path:** Business Development › Channel Management › Financial Message Analysis  
**BIAN id:** `36477`  
**Business Area:** Business Development  
**Business Domain:** Channel Management

**API.** No semantic API published for this Service Domain in BIAN release 14.0.0.

### Service Domain: Branch Location Management

**Path:** Business Development › Channel Management › Branch Location Management  
**BIAN id:** `37330`  
**Business Area:** Business Development  
**Business Domain:** Channel Management

**What it does.** Manage and oversee branch activity, assign resources to optimize branch performance

**API.** Published as `BranchLocationManagement.yaml` (OpenAPI 3 and AsyncAPI 3) — control record BranchLocationManagementPlan; behavior qualifiers CustomerLiaison, ProductandServicePlanning, StaffandLocationPlanning, Troubleshooting; 27 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/BranchLocationManagement.yaml)

### Service Domain: Channel Portfolio

**Path:** Business Development › Channel Management › Channel Portfolio  
**BIAN id:** `37814`  
**Business Area:** Business Development  
**Business Domain:** Channel Management

**API.** No semantic API published for this Service Domain in BIAN release 14.0.0.

### Service Domain: Branch Network Management

**Path:** Business Development › Channel Management › Branch Network Management  
**BIAN id:** `38452`  
**Business Area:** Business Development  
**Business Domain:** Channel Management

**API.** No semantic API published for this Service Domain in BIAN release 14.0.0.

### Service Domain: Branch Currency Management

**Path:** Business Development › Channel Management › Branch Currency Management  
**BIAN id:** `39191`  
**Business Area:** Business Development  
**Business Domain:** Channel Management

**What it does.** Track cash inventory, project demand and ensure all cash is accounted for within the branch

**API.** Published as `BranchCurrencyManagement.yaml` (OpenAPI 3 and AsyncAPI 3) — control record BranchCashAllocation; behavior qualifiers InventoryAllocation; 12 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/BranchCurrencyManagement.yaml)

### Service Domain: Contact Center Management

**Path:** Business Development › Channel Management › Contact Center Management  
**BIAN id:** `40362`  
**Business Area:** Business Development  
**Business Domain:** Channel Management

**What it does.** Oversee the assignment and operation of the customer contact center

**API.** Published as `ContactCenterManagement.yaml` (OpenAPI 3 and AsyncAPI 3) — control record ContactCenterManagementPlan; behavior qualifiers Performance, Troubleshooting; 12 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/ContactCenterManagement.yaml)

### Service Domain: Servicing Activity Analysis

**Path:** Business Development › Channel Management › Servicing Activity Analysis  
**BIAN id:** `41149`  
**Business Area:** Business Development  
**Business Domain:** Channel Management

**What it does.** This service domain analyzes servicing activity to support continual service improvement

**API.** Published as `ServicingActivityAnalysis.yaml` (OpenAPI 3 and AsyncAPI 3) — control record ServicingRootCauseAnalysis; behavior qualifiers RootCauseAlgorithm; 8 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/ServicingActivityAnalysis.yaml)

### Service Domain: Product Inventory Item Management

**Path:** Business Development › Channel Management › Product Inventory Item Management  
**BIAN id:** `47318`  
**Business Area:** Business Development  
**Business Domain:** Channel Management

**What it does.** Maintain and distribute product inventory

**API.** Published as `ProductInventoryItemManagement.yaml` (OpenAPI 3 and AsyncAPI 3) — control record ProductInventoryAllocation; behavior qualifiers Assignment; 8 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/ProductInventoryItemManagement.yaml)

### Service Domain: ATM Network Management

**Path:** Business Development › Channel Management › ATM Network Management  
**BIAN id:** `48013`  
**Business Area:** Business Development  
**Business Domain:** Channel Management

**API.** No semantic API published for this Service Domain in BIAN release 14.0.0.

## Business Domain: Intelectual Property And Knowledge

`146489` — part of the Business Development Business Area. Contains 4 Service Domains: Enterprise Architecture, Intellectual Property Portfolio, Management Manual, Knowledge Exchange.

### Service Domain: Enterprise Architecture

**Path:** Business Development › Intelectual Property And Knowledge › Enterprise Architecture  
**BIAN id:** `29101`  
**Business Area:** Business Development  
**Business Domain:** Intelectual Property And Knowledge

**What it does.** Define and maintain comprehensive business architectural definitions/blueprints to help organize/direct the business

**API.** Published as `EnterpriseArchitecture.yaml` (OpenAPI 3 and AsyncAPI 3) — control record EnterpriseArchitectureSpecification; behavior qualifiers ApplicationArchitecture, BusinessArchitecture, InformationArchitecture, Organization, TechnologyInfrastructure; 27 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/EnterpriseArchitecture.yaml)

### Service Domain: Intellectual Property Portfolio

**Path:** Business Development › Intelectual Property And Knowledge › Intellectual Property Portfolio  
**BIAN id:** `31008`  
**Business Area:** Business Development  
**Business Domain:** Intelectual Property And Knowledge

**What it does.** Administer the bank's intellectual property assets

**API.** Published as `IntellectualPropertyPortfolio.yaml` (OpenAPI 3 and AsyncAPI 3) — control record IntellectualPropertyAdministrativePlan; behavior qualifiers Assignment, Maintenance; 14 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/IntellectualPropertyPortfolio.yaml)

### Service Domain: Management Manual

**Path:** Business Development › Intelectual Property And Knowledge › Management Manual  
**BIAN id:** `36312`  
**Business Area:** Business Development  
**Business Domain:** Intelectual Property And Knowledge

**What it does.** Develop, maintain and promulgate the management manual of required procedures and guidelines. Provide support in its reference and interpretation as appropriate

**API.** Published as `ManagementManual.yaml` (OpenAPI 3 and AsyncAPI 3) — control record ManagementManualSpecification; behavior qualifiers CompanyMissionandPolicies, EmploymentRelatedProceduresandGuidelines, LegalandRegulatoryObligationsandGuidelines, OperationalSecurityProceduresandGuidelines, OperationalandProductionProceduresandGuidelines, StaffManagementProceduresandGuidelines; 31 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/ManagementManual.yaml)

### Service Domain: Knowledge Exchange

**Path:** Business Development › Intelectual Property And Knowledge › Knowledge Exchange  
**BIAN id:** `40522`  
**Business Area:** Business Development  
**Business Domain:** Intelectual Property And Knowledge

**What it does.** Consolidate, classify and provide structured access to consolidated market intelligence, product and procedural knowledge gained from the workforce in the execution of business to inform business activity and support continual improvement

**API.** Published as `KnowledgeExchange.yaml` (OpenAPI 3 and AsyncAPI 3) — control record IntellectualPropertyExchangeOperatingSession; behavior qualifiers Archiving, CaptureandClassification, IndexingandPublication, MaintenanceandAccessAdministration, Review_RefinementandEditing; 23 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/KnowledgeExchange.yaml)

## Business Domain: Models And Analytics

`146495` — part of the Business Development Business Area. Contains 9 Service Domains: Trading Models, Market Risk Models, Financial Instrument Valuation Models, Credit Risk Models, Quant Model, Customer Behavior Models, Liquidity Risk Models, Fraud Model, Contribution Models.

### Service Domain: Trading Models

**Path:** Business Development › Models And Analytics › Trading Models  
**BIAN id:** `29368`  
**Business Area:** Business Development  
**Business Domain:** Models And Analytics

**API.** No semantic API published for this Service Domain in BIAN release 14.0.0.

### Service Domain: Market Risk Models

**Path:** Business Development › Models And Analytics › Market Risk Models  
**BIAN id:** `30854`  
**Business Area:** Business Development  
**Business Domain:** Models And Analytics

**API.** No semantic API published for this Service Domain in BIAN release 14.0.0.

### Service Domain: Financial Instrument Valuation Models

**Path:** Business Development › Models And Analytics › Financial Instrument Valuation Models  
**BIAN id:** `31059`  
**Business Area:** Business Development  
**Business Domain:** Models And Analytics

**API.** No semantic API published for this Service Domain in BIAN release 14.0.0.

### Service Domain: Credit Risk Models

**Path:** Business Development › Models And Analytics › Credit Risk Models  
**BIAN id:** `32106`  
**Business Area:** Business Development  
**Business Domain:** Models And Analytics

**What it does.** This service domain handles the design and maintenance of a portfolio of credit models that are used in all aspects of customer credit assessments

**API.** Published as `CreditRiskModels.yaml` (OpenAPI 3 and AsyncAPI 3) — control record CreditRiskModelSpecification; behavior qualifiers FunctionalRequirements, Production, Testing; 19 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/CreditRiskModels.yaml)

### Service Domain: Quant Model

**Path:** Business Development › Models And Analytics › Quant Model  
**BIAN id:** `33652`  
**Business Area:** Business Development  
**Business Domain:** Models And Analytics

**API.** No semantic API published for this Service Domain in BIAN release 14.0.0.

### Service Domain: Customer Behavior Models

**Path:** Business Development › Models And Analytics › Customer Behavior Models  
**BIAN id:** `33836`  
**Business Area:** Business Development  
**Business Domain:** Models And Analytics

**What it does.** This service domain handles the design and maintenance of a portfolio of customer behavior models that might be used in all aspects of customer relationship development, sales, servicing and product fulfillment

**API.** Published as `CustomerBehaviorModels.yaml` (OpenAPI 3 and AsyncAPI 3) — control record CustomerBehaviorModelSpecification; behavior qualifiers FunctionalRequirements, Production, Testing; 15 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/CustomerBehaviorModels.yaml)

### Service Domain: Liquidity Risk Models

**Path:** Business Development › Models And Analytics › Liquidity Risk Models  
**BIAN id:** `34490`  
**Business Area:** Business Development  
**Business Domain:** Models And Analytics

**API.** No semantic API published for this Service Domain in BIAN release 14.0.0.

### Service Domain: Fraud Model

**Path:** Business Development › Models And Analytics › Fraud Model  
**BIAN id:** `42516`  
**Business Area:** Business Development  
**Business Domain:** Models And Analytics

**What it does.** This service domain handles the design and maintenance of a portfolio of fraud models used across all production activity to detect potential fraud on the part of customers, merchants and other involved parties

**API.** Published as `FraudModel.yaml` (OpenAPI 3 and AsyncAPI 3) — control record FraudModelSpecification; behavior qualifiers FunctionalRequirements, Production, Testing; 15 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/FraudModel.yaml)

### Service Domain: Contribution Models

**Path:** Business Development › Models And Analytics › Contribution Models  
**BIAN id:** `45224`  
**Business Area:** Business Development  
**Business Domain:** Models And Analytics

**API.** No semantic API published for this Service Domain in BIAN release 14.0.0.
