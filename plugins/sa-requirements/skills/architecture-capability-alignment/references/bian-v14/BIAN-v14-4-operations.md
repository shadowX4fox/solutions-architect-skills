# BIAN Service Landscape v14.0.0 — Business Area: Operations

This document covers **one** of the eight BIAN Business Areas: **Operations** (model id `146498`). It contains 5 Business Domains and 64 Service Domains, 61 of which have a published semantic API.

The eight BIAN Business Areas are: Business Management, Resource Management, Finance And Risk Management, Operations, Products, Customers, Channels, and Business Development. Service Domains belonging to the other seven areas are documented in their own files.

Each Service Domain below states its path, BIAN id and published API. Where an API exists, **What it does.** is that API's own one-line description, from BIAN's semantic API repository (Apache License 2.0). The Service Landscape's role definitions and examples of use are © BIAN and are not bundled: an institution pack supplies the full text (docs/INSTITUTION_PACKS.md).

Source: the taxonomy of the BIAN Service Landscape V14.0 Value Chain View; API descriptions from github.com/bian-official/public (Apache License 2.0).

---

## Business Domain: External Agency

`146486` — part of the Operations Business Area. Contains 12 Service Domains: Syndicate Management, Product Service Agency, Interbank Relationship Management, Service Provider Operations, Sub Custodian Agreement, Correspondent Bank Relationship Management, Contractor and Supplier Agreement, Operations Log, Commission Agreement, Partner Management, Partner Agreement, Partner Administration.

### Service Domain: Syndicate Management

**Path:** Operations › External Agency › Syndicate Management  
**BIAN id:** `28847`  
**Business Area:** Operations  
**Business Domain:** External Agency

**What it does.** This Service Domain manages syndicate membership and compliance

**API.** Published as `SyndicateManagement.yaml` (OpenAPI 3 and AsyncAPI 3) — control record SyndicateMembership; behavior qualifiers SyndicateComplianceClauses, SyndicateEligibilityClauses; 13 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/SyndicateManagement.yaml)

### Service Domain: Product Service Agency

**Path:** Operations › External Agency › Product Service Agency  
**BIAN id:** `30247`  
**Business Area:** Operations  
**Business Domain:** External Agency

**What it does.** This Service Domain establishes and maintains contractual arrangements with product and service agencies

**API.** Published as `ProductServiceAgency.yaml` (OpenAPI 3 and AsyncAPI 3) — control record ServiceProviderAgreement; behavior qualifiers LegalTerm, PolicyTerm, RegulatoryTerm; 26 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/ProductServiceAgency.yaml)

### Service Domain: Interbank Relationship Management

**Path:** Operations › External Agency › Interbank Relationship Management  
**BIAN id:** `30310`  
**Business Area:** Operations  
**Business Domain:** External Agency

**What it does.** Manage the bank's relationship with other banks, covering any specific agreements that may be in place and overseeing operational issues.

**API.** Published as `InterbankRelationshipManagement.yaml` (OpenAPI 3 and AsyncAPI 3) — control record BankRelationshipManagementPlan; behavior qualifiers Contact; 11 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/InterbankRelationshipManagement.yaml)

### Service Domain: Service Provider Operations

**Path:** Operations › External Agency › Service Provider Operations  
**BIAN id:** `31855`  
**Business Area:** Operations  
**Business Domain:** External Agency

**What it does.** This Service Domain handles the range of operational actions used in production interactions with an external service provider.

**API.** Published as `ServiceProviderOperations.yaml` (OpenAPI 3 and AsyncAPI 3) — control record ServiceProviderRegistrationOperatingSession; 1 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/ServiceProviderOperations.yaml)

### Service Domain: Sub Custodian Agreement

**Path:** Operations › External Agency › Sub Custodian Agreement  
**BIAN id:** `33986`  
**Business Area:** Operations  
**Business Domain:** External Agency

**What it does.** This Service Domain establishes and maintains the terms governing sub custodian relationship

**API.** Published as `SubCustodianAgreement.yaml` (OpenAPI 3 and AsyncAPI 3) — control record SubCustodianAgreement; behavior qualifiers LegalTerm, PolicyTerm, RegulatoryTerm; 26 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/SubCustodianAgreement.yaml)

### Service Domain: Correspondent Bank Relationship Management

**Path:** Operations › External Agency › Correspondent Bank Relationship Management  
**BIAN id:** `34643`  
**Business Area:** Operations  
**Business Domain:** External Agency

**What it does.** This Service Domain manages correspondent bank relations, ensuring reciprocity and developing business where possible

**API.** Published as `CorrespondentBankRelationshipManagement.yaml` (OpenAPI 3 and AsyncAPI 3) — control record CorrepondentBankRelationshipManagementPlan; behavior qualifiers IncidentTroubleshootingOversight, RelationshipDevelopment, RelationshipReciprocityAssessment; 26 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/CorrespondentBankRelationshipManagement.yaml)

### Service Domain: Contractor and Supplier Agreement

**Path:** Operations › External Agency › Contractor and Supplier Agreement  
**BIAN id:** `36784`  
**Business Area:** Operations  
**Business Domain:** External Agency

**What it does.** This Service Domain maintains appropriate supplier agreements/contracts

**API.** Published as `ContractorandSupplierAgreement.yaml` (OpenAPI 3 and AsyncAPI 3) — control record SupplierAgreement; behavior qualifiers LegalTerm, PolicyTerm, RegulatoryTerm; 26 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/ContractorandSupplierAgreement.yaml)

### Service Domain: Operations Log

**Path:** Operations › External Agency › Operations Log  
**BIAN id:** `36992`  
**Business Area:** Operations  
**Business Domain:** External Agency

**What it does.** This service domain handle the day-to-day operations of a collaborative partner related services.

**API.** Published as `OperationsLog.yaml` (OpenAPI 3 and AsyncAPI 3) — 0 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/OperationsLog.yaml)

### Service Domain: Commission Agreement

**Path:** Operations › External Agency › Commission Agreement  
**BIAN id:** `38335`  
**Business Area:** Operations  
**Business Domain:** External Agency

**What it does.** Maintain and administer the terms and transactions for employee and broker commissions

**API.** Published as `CommissionAgreement.yaml` (OpenAPI 3 and AsyncAPI 3) — control record EmployeeCommissionAgreement; behavior qualifiers CommissionTerm; 14 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/CommissionAgreement.yaml)

### Service Domain: Partner Management

**Path:** Operations › External Agency › Partner Management  
**BIAN id:** `42103`  
**Business Area:** Operations  
**Business Domain:** External Agency

**What it does.** This service domain handles strategic management of collaborative partners including partner development, performance and relationship tracking.

**API.** Published as `PartnerManagement.yaml` (OpenAPI 3 and AsyncAPI 3) — 0 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/PartnerManagement.yaml)

### Service Domain: Partner Agreement

**Path:** Operations › External Agency › Partner Agreement  
**BIAN id:** `43761`  
**Business Area:** Operations  
**Business Domain:** External Agency

**What it does.** This service domain captures and maintains comprehensive terms and conditions govering Partner relationships.

**API.** Published as `PartnerAgreement.yaml` (OpenAPI 3 and AsyncAPI 3) — control record PartnerAgreement; behavior qualifiers LegalTerm, PolicyTerm, RegulatoryTerm; 16 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/PartnerAgreement.yaml)

### Service Domain: Partner Administration

**Path:** Operations › External Agency › Partner Administration  
**BIAN id:** `49056`  
**Business Area:** Operations  
**Business Domain:** External Agency

**What it does.** This service domain handle the day-to-day operations of a collaborative partner related services.

**API.** Published as `PartnerAdministration.yaml` (OpenAPI 3 and AsyncAPI 3) — 0 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/PartnerAdministration.yaml)

## Business Domain: Operational Services

`146497` — part of the Operations Business Area. Contains 18 Service Domains: Internal Bank Account, Incentive Account, Card Collections, Customer Billing, Issued Certificate Directory, Term Deposit Framework Agreement, Disbursement, Reward Points Awards And Redemption, Rewards Inventory, Rewards Menu, Issued Device Administration, Issued Device Tracking, Card Transaction Switch, Incentive Program Directory, Open Item Management, Rewards Delivery, Delinquent Account Handling, Product Combination.

### Service Domain: Internal Bank Account

**Path:** Operations › Operational Services › Internal Bank Account  
**BIAN id:** `29306`  
**Business Area:** Operations  
**Business Domain:** Operational Services

**What it does.** This Service Domain manages the banking-related accounts that are not owned by customers. These are not general ledger accounts. Typical examples are holding accounts and mirror accounts.

**API.** Published as `InternalBankAccount.yaml` (OpenAPI 3 and AsyncAPI 3) — control record InternalBankAccountFacility; behavior qualifiers Booking; 7 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/InternalBankAccount.yaml)

### Service Domain: Incentive Account

**Path:** Operations › Operational Services › Incentive Account  
**BIAN id:** `29328`  
**Business Area:** Operations  
**Business Domain:** Operational Services

**What it does.** This service domain orchestrates the scheduled maintenance and transactional activities associated with Incentive Program fulfillment, including enrollment, accrual and redemption.

**API.** Published as `IncentiveAccount.yaml` (OpenAPI 3 and AsyncAPI 3) — 0 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/IncentiveAccount.yaml)

### Service Domain: Card Collections

**Path:** Operations › Operational Services › Card Collections  
**BIAN id:** `30625`  
**Business Area:** Operations  
**Business Domain:** Operational Services

**What it does.** This service domain administers the recovery of outstanding amounts from cancelled card accounts through internal or external collection agencies. This may involve negotiating payment terms and/or interest write-downs.

**API.** Published as `CardCollections.yaml` (OpenAPI 3 and AsyncAPI 3) — control record CardCollectionsProcedure; behavior qualifiers Assignment, Payment, PaymentTerms, Resolution; 16 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/CardCollections.yaml)

### Service Domain: Customer Billing

**Path:** Operations › Operational Services › Customer Billing  
**BIAN id:** `32825`  
**Business Area:** Operations  
**Business Domain:** Operational Services

**What it does.** This service domains provides a central service to compose, issue and track customer billing and invoices

**API.** Published as `CustomerBilling.yaml` (OpenAPI 3 and AsyncAPI 3) — control record CustomerBillingProcedure; behavior qualifiers Invoicing, Payment, TrackingandReminders; 15 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/CustomerBilling.yaml)

### Service Domain: Issued Certificate Directory

**Path:** Operations › Operational Services › Issued Certificate Directory  
**BIAN id:** `34655`  
**Business Area:** Operations  
**Business Domain:** Operational Services

**What it does.** This service domain faciliatates the issuance of Rewards Certificates and their redemption.

**API.** Published as `IssuedCertificateDirectory.yaml` (OpenAPI 3 and AsyncAPI 3) — 0 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/IssuedCertificateDirectory.yaml)

### Service Domain: Term Deposit Framework Agreement

**Path:** Operations › Operational Services › Term Deposit Framework Agreement  
**BIAN id:** `34954`  
**Business Area:** Operations  
**Business Domain:** Operational Services

**What it does.** A Term Deposit Framework Agreement is an agreement between a customer and the bank under which individual term deposits can be opened. It specifies standard conditions that will apply to each underlying term deposit.

**API.** Published as `TermDepositFrameworkAgreement.yaml` (OpenAPI 3 and AsyncAPI 3) — control record TermDepositFrameworkAgreementFacility; 3 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/TermDepositFrameworkAgreement.yaml)

### Service Domain: Disbursement

**Path:** Operations › Operational Services › Disbursement  
**BIAN id:** `37082`  
**Business Area:** Operations  
**Business Domain:** Operational Services

**What it does.** This service domain handles the disbursement of funds to newly established loans/facilities as necessary

**API.** Published as `Disbursement.yaml` (OpenAPI 3 and AsyncAPI 3) — control record DisbursementTransaction; 7 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/Disbursement.yaml)

### Service Domain: Reward Points Awards And Redemption

**Path:** Operations › Operational Services › Reward Points Awards And Redemption  
**BIAN id:** `38133`  
**Business Area:** Operations  
**Business Domain:** Operational Services

**What it does.** Handle the allocation and redemption of rewards points for customer transaction activity

**API.** Published as `RewardPointsAwardsAndRedemption.yaml` (OpenAPI 3 and AsyncAPI 3) — control record RewardPointsTransaction; behavior qualifiers Award, Redemption; 14 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/RewardPointsAwardsAndRedemption.yaml)

### Service Domain: Rewards Inventory

**Path:** Operations › Operational Services › Rewards Inventory  
**BIAN id:** `38267`  
**Business Area:** Operations  
**Business Domain:** Operational Services

**What it does.** The service domain handles the allocation of rewards from available inventory.

**API.** Published as `RewardsInventory.yaml` (OpenAPI 3 and AsyncAPI 3) — 0 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/RewardsInventory.yaml)

### Service Domain: Rewards Menu

**Path:** Operations › Operational Services › Rewards Menu  
**BIAN id:** `41078`  
**Business Area:** Operations  
**Business Domain:** Operational Services

**What it does.** The service domain presents a set of eligible rewards a customer can select from.

**API.** Published as `RewardsMenu.yaml` (OpenAPI 3 and AsyncAPI 3) — 0 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/RewardsMenu.yaml)

### Service Domain: Issued Device Administration

**Path:** Operations › Operational Services › Issued Device Administration  
**BIAN id:** `42500`  
**Business Area:** Operations  
**Business Domain:** Operational Services

**What it does.** This service domain administers the issuance of authentication tokens to customers and third party service providers. Tokens here include physical devices such as cards, fobs, readers and intangible 'devices' such as passwords and secret questions. Administration includes version tracking, replacement and duration/frequency limits. Specific product/service access permissions may be associated with an issued token when appropriate

**API.** Published as `IssuedDeviceAdministration.yaml` (OpenAPI 3 and AsyncAPI 3) — control record IssuedDeviceAllocation; behavior qualifiers BiometricAssignment, ChequesAssignment, DeviceAssignment, PasswordAssignment, QuestionAssignment, ReaderAssignment, TokenAssignment; 39 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/IssuedDeviceAdministration.yaml)

### Service Domain: Issued Device Tracking

**Path:** Operations › Operational Services › Issued Device Tracking  
**BIAN id:** `42755`  
**Business Area:** Operations  
**Business Domain:** Operational Services

**What it does.** This service domain handles operational access to issued device tracking services. Services report on the status of devices such as cards, fobs, etc. that have been issued to customers. Service notifications include fraud warnings/alerts and device cancellation.

**API.** Published as `IssuedDeviceTracking.yaml` (OpenAPI 3 and AsyncAPI 3) — control record IssuedDeviceState; behavior qualifiers ExternalReport, InternalNotification; 10 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/IssuedDeviceTracking.yaml)

### Service Domain: Card Transaction Switch

**Path:** Operations › Operational Services › Card Transaction Switch  
**BIAN id:** `43682`  
**Business Area:** Operations  
**Business Domain:** Operational Services

**What it does.** This service domain orchestrates the switching and routing of Card Authorization and Financial transactions received through the Card POS Network, Card E-Commerce Gateway, or the ATM Network from the Acquirer to the Issuer through the Card Networks.

**API.** Published as `CardTransactionSwitch.yaml` (OpenAPI 3 and AsyncAPI 3) — control record CardTransactionSwitchOperatingSession; behavior qualifiers TransactionCapture; 7 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/CardTransactionSwitch.yaml)

### Service Domain: Incentive Program Directory

**Path:** Operations › Operational Services › Incentive Program Directory  
**BIAN id:** `46501`  
**Business Area:** Operations  
**Business Domain:** Operational Services

**What it does.** This service domain maintains specifications of the various Incentive Programs that are on offerr to customers.

**API.** Published as `IncentiveProgramDirectory.yaml` (OpenAPI 3 and AsyncAPI 3) — 0 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/IncentiveProgramDirectory.yaml)

### Service Domain: Open Item Management

**Path:** Operations › Operational Services › Open Item Management  
**BIAN id:** `46917`  
**Business Area:** Operations  
**Business Domain:** Operational Services

**What it does.** This service domain provides a service for handling the resolution of open items against accounts (such as overdue loan payments)

**API.** Published as `OpenItemManagement.yaml` (OpenAPI 3 and AsyncAPI 3) — control record OpenItemProcedure; behavior qualifiers Repayment, Tracking; 11 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/OpenItemManagement.yaml)

### Service Domain: Rewards Delivery

**Path:** Operations › Operational Services › Rewards Delivery  
**BIAN id:** `48197`  
**Business Area:** Operations  
**Business Domain:** Operational Services

**What it does.** The service domain orchestrates the entire end-to-end process for delivering a redeemed reward.

**API.** Published as `RewardsDelivery.yaml` (OpenAPI 3 and AsyncAPI 3) — 0 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/RewardsDelivery.yaml)

### Service Domain: Delinquent Account Handling

**Path:** Operations › Operational Services › Delinquent Account Handling  
**BIAN id:** `49245`  
**Business Area:** Operations  
**Business Domain:** Operational Services

**What it does.** This service domain handles delinquent accounts (typically for active credit/charge cards) for follow-up of payments due through periodic review and contacts. This process ends when the account is cancelled and is transferred to Collections

**API.** Published as `DelinquentAccountHandling.yaml` (OpenAPI 3 and AsyncAPI 3) — control record DelinquentAccountProcedure; behavior qualifiers Assessment, Contact, Payment, Resolution; 16 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/DelinquentAccountHandling.yaml)

### Service Domain: Product Combination

**Path:** Operations › Operational Services › Product Combination  
**BIAN id:** `49319`  
**Business Area:** Operations  
**Business Domain:** Operational Services

**What it does.** Product Combination supports bundled products applying necessary constraints on embedded product fulfillment and ensuring product performance analysis takes correct account of embedded products' contribution

**API.** Published as `ProductCombination.yaml` (OpenAPI 3 and AsyncAPI 3) — control record ProductCombinationFacility; behavior qualifiers Fulfillment, SupportFacility, TransferPricing; 21 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/ProductCombination.yaml)

## Business Domain: Custody, Collateral And Documents

`146483` — part of the Operations Business Area. Contains 10 Service Domains: Custody Administration, Document Directory, Party Asset Directory, Collections, Document Services, Collateral Asset Administration, Collateral Allocation Management, Archive Services, Investment Account, Account Recovery.

### Service Domain: Custody Administration

**Path:** Operations › Custody, Collateral And Documents › Custody Administration  
**BIAN id:** `31179`  
**Business Area:** Operations  
**Business Domain:** Custody, Collateral And Documents

**What it does.** A service to provide safe custody services for marketable securities for bank customers

**API.** Published as `CustodyAdministration.yaml` (OpenAPI 3 and AsyncAPI 3) — control record CustodyFacility; behavior qualifiers Charge, Dividend, RegulatorySubmission, SafeKeeping, Settlement; 26 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/CustodyAdministration.yaml)

### Service Domain: Document Directory

**Path:** Operations › Custody, Collateral And Documents › Document Directory  
**BIAN id:** `32570`  
**Business Area:** Operations  
**Business Domain:** Custody, Collateral And Documents

**What it does.** This Service Domain provides a directory based categorization and storage mechanism for documents created and referenced by the bank

**API.** Published as `DocumentDirectory.yaml` (OpenAPI 3 and AsyncAPI 3) — control record DocumentDirectoryEntry; behavior qualifiers DocumentAmendmentProperties, DocumentArchivingProperties, DocumentReferenceProperties, DocumentUpdateHistoryProperties, DocumentVerificationProperties, DocumentVersionProperties; 44 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/DocumentDirectory.yaml)

### Service Domain: Party Asset Directory

**Path:** Operations › Custody, Collateral And Documents › Party Asset Directory  
**BIAN id:** `33829`  
**Business Area:** Operations  
**Business Domain:** Custody, Collateral And Documents

**What it does.** This directory maintains reference details of assets held by a party, usually a customer of the bank. In most case, the bank's interest in the asset is because it may be pledged to the bank as collateral.

**API.** Published as `PartyAssetDirectory.yaml` (OpenAPI 3 and AsyncAPI 3) — behavior qualifiers AssetEstimatedValue, AssetInsurance, AssetMaintenance, AssetProperties; 12 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/PartyAssetDirectory.yaml)

### Service Domain: Collections

**Path:** Operations › Custody, Collateral And Documents › Collections  
**BIAN id:** `34511`  
**Business Area:** Operations  
**Business Domain:** Custody, Collateral And Documents

**What it does.** Handles the liquidation of assets to offset the losses for problem accounts

**API.** Published as `Collections.yaml` (OpenAPI 3 and AsyncAPI 3) — control record CollateralAssetLiquidationProcedure; behavior qualifiers CollateralLiquidation, CollateralValuation, CollectionsAccountUpdate, CollectionsAssessment, DebtFactoring; 24 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/Collections.yaml)

### Service Domain: Document Services

**Path:** Operations › Custody, Collateral And Documents › Document Services  
**BIAN id:** `38072`  
**Business Area:** Operations  
**Business Domain:** Custody, Collateral And Documents

**What it does.** The Document Services Service Domain manages the creation and maintenance of documents throughout the bank.

**API.** Published as `DocumentServices.yaml` (OpenAPI 3 and AsyncAPI 3) — control record DocumentServiceProcedure; 6 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/DocumentServices.yaml)

### Service Domain: Collateral Asset Administration

**Path:** Operations › Custody, Collateral And Documents › Collateral Asset Administration  
**BIAN id:** `39957`  
**Business Area:** Operations  
**Business Domain:** Custody, Collateral And Documents

**What it does.** This service domain maintains the status of a customers collateral assets, including scheduled and ad-hoc valuations and confirmation of the correct completion of scheduled maintenance tasks.

**API.** Published as `CollateralAssetAdministration.yaml` (OpenAPI 3 and AsyncAPI 3) — control record CollateralAssetAdministrativePlan; behavior qualifiers Maintenance, Valuation; 12 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/CollateralAssetAdministration.yaml)

### Service Domain: Collateral Allocation Management

**Path:** Operations › Custody, Collateral And Documents › Collateral Allocation Management  
**BIAN id:** `40635`  
**Business Area:** Operations  
**Business Domain:** Custody, Collateral And Documents

**What it does.** The Service Domain manages the allocation of party owned assets to bank issued lending and other asset products.

**API.** Published as `CollateralAllocationManagement.yaml` (OpenAPI 3 and AsyncAPI 3) — control record CollateralAssetAllocation; 4 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/CollateralAllocationManagement.yaml)

### Service Domain: Archive Services

**Path:** Operations › Custody, Collateral And Documents › Archive Services  
**BIAN id:** `43633`  
**Business Area:** Operations  
**Business Domain:** Custody, Collateral And Documents

**What it does.** The Archive Services Service Domain enables the bank to retain, maintain and access significant documents that are no longer actively accessed but that might be required in the future

**API.** Published as `ArchiveServices.yaml` (OpenAPI 3 and AsyncAPI 3) — control record ArchiveOperatingSession; behavior qualifiers DocumentCapture, DocumentMaintenance, DocumentRetrieval; 29 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/ArchiveServices.yaml)

### Service Domain: Investment Account

**Path:** Operations › Custody, Collateral And Documents › Investment Account  
**BIAN id:** `43878`  
**Business Area:** Operations  
**Business Domain:** Custody, Collateral And Documents

**What it does.** This service domain handles the non-cash holdings positions for a customer, covering multiple instruments as necessary

**API.** Published as `InvestmentAccount.yaml` (OpenAPI 3 and AsyncAPI 3) — control record InvestmentAccountFacility; behavior qualifiers Charge, CorporateAction, DebitandCredit, Deposit; 25 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/InvestmentAccount.yaml)

### Service Domain: Account Recovery

**Path:** Operations › Custody, Collateral And Documents › Account Recovery  
**BIAN id:** `45370`  
**Business Area:** Operations  
**Business Domain:** Custody, Collateral And Documents

**What it does.** This service domain handles the restructuring of a distressed account (loan) after standard recovery procedures have been exhausted

**API.** Published as `AccountRecovery.yaml` (OpenAPI 3 and AsyncAPI 3) — control record AccountRecoveryProcedure; behavior qualifiers Assessment, Modification, Negotiation, Planning, Writedown; 17 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/AccountRecovery.yaml)

## Business Domain: Clearing And Settlement

`146476` — part of the Operations Business Area. Contains 12 Service Domains: Order Allocation, Transaction Engine, Cheque Processing, Correspondent Bank Directory, Payment Settlement, Card Clearing, Counterparty Administration, Payment Rail, Payment Confirmation, Payment Orchestration, Card Financial Settlement, Card eCommerce Gateway.

### Service Domain: Order Allocation

**Path:** Operations › Clearing And Settlement › Order Allocation  
**BIAN id:** `30791`  
**Business Area:** Operations  
**Business Domain:** Clearing And Settlement

**What it does.** This Service Domain allocates partially fulfilled market trades

**API.** Published as `OrderAllocation.yaml` (OpenAPI 3 and AsyncAPI 3) — control record SecuritiesAllocationProcedure; behavior qualifiers ApplyOrderAllocationRules, Update(PartiallyCompleted)MarketOrder; 22 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/OrderAllocation.yaml)

### Service Domain: Transaction Engine

**Path:** Operations › Clearing And Settlement › Transaction Engine  
**BIAN id:** `35970`  
**Business Area:** Operations  
**Business Domain:** Clearing And Settlement

**What it does.** Orchestrate a schedule of payment transaction and reporting activities for the fulfillment of certain long term instruments or structured facilities

**API.** Published as `TransactionEngine.yaml` (OpenAPI 3 and AsyncAPI 3) — control record TransactionScheduleFacility; 6 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/TransactionEngine.yaml)

### Service Domain: Cheque Processing

**Path:** Operations › Clearing And Settlement › Cheque Processing  
**BIAN id:** `37387`  
**Business Area:** Operations  
**Business Domain:** Clearing And Settlement

**What it does.** Handle the processing of paper cheques, generating financial transactions for processing

**API.** Published as `ChequeProcessing.yaml` (OpenAPI 3 and AsyncAPI 3) — control record ChequeProcessingOperatingSession; behavior qualifiers ChequeExceptionHandling, ChequeExtraction, FinancialTransactionInitiation; 13 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/ChequeProcessing.yaml)

### Service Domain: Correspondent Bank Directory

**Path:** Operations › Clearing And Settlement › Correspondent Bank Directory  
**BIAN id:** `39320`  
**Business Area:** Operations  
**Business Domain:** Clearing And Settlement

**What it does.** This service domain maintains correspondent bank reference details. This includes correspondent bank payment parameters in particular bank limits and capturing transaction activity to track reciprocity

**API.** Published as `CorrespondentBankDirectory.yaml` (OpenAPI 3 and AsyncAPI 3) — control record CorrespondentBankDirectoryEntry; 4 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/CorrespondentBankDirectory.yaml)

### Service Domain: Payment Settlement

**Path:** Operations › Clearing And Settlement › Payment Settlement  
**BIAN id:** `40033`  
**Business Area:** Operations  
**Business Domain:** Clearing And Settlement

**API.** No semantic API published for this Service Domain in BIAN release 14.0.0.

### Service Domain: Card Clearing

**Path:** Operations › Clearing And Settlement › Card Clearing  
**BIAN id:** `44578`  
**Business Area:** Operations  
**Business Domain:** Clearing And Settlement

**What it does.** This service domain orchestrates the capture and consolidation of card financial transactions originating from various sources, such as POS Network, E-Commerce Gateway, ATM Network, or Card Case Management. It also handles the clearing of the transactions from the Acquirers to the Issuers through the Card Networks

**API.** Published as `CardClearing.yaml` (OpenAPI 3 and AsyncAPI 3) — control record CardClearingProcedure; behavior qualifiers Addressing, Capture, Charge, FXConversion, Matching, Reconciliation, Routing; 13 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/CardClearing.yaml)

### Service Domain: Counterparty Administration

**Path:** Operations › Clearing And Settlement › Counterparty Administration  
**BIAN id:** `45689`  
**Business Area:** Operations  
**Business Domain:** Clearing And Settlement

**What it does.** This Service Domain maintains key counterparty reference information used in the clearing and settlement of wholesale trading

**API.** Published as `CounterpartyAdministration.yaml` (OpenAPI 3 and AsyncAPI 3) — control record CounterpartyDirectoryEntry; behavior qualifiers CounterpartyEntityReference, CounterpartyPermittedTransaction; 19 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/CounterpartyAdministration.yaml)

### Service Domain: Payment Rail

**Path:** Operations › Clearing And Settlement › Payment Rail  
**BIAN id:** `47741`  
**Business Area:** Operations  
**Business Domain:** Clearing And Settlement

**What it does.** This Service Domain handles the operational interface with payment service providers, formatting outbound transactions and onward routing inbound transactions during scheduled operating sessions. It also links to holding account facilities for net payment handling

**API.** Published as `PaymentRail.yaml` (OpenAPI 3 and AsyncAPI 3) — control record PaymentRailOperatingSession; behavior qualifiers InboundTransaction, OutboundTransaction, PaymentAccountReconciliation, PaymentClearingandSettlement; 36 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/PaymentRail.yaml)

### Service Domain: Payment Confirmation

**Path:** Operations › Clearing And Settlement › Payment Confirmation  
**BIAN id:** `47766`  
**Business Area:** Operations  
**Business Domain:** Clearing And Settlement

**API.** No semantic API published for this Service Domain in BIAN release 14.0.0.

### Service Domain: Payment Orchestration

**Path:** Operations › Clearing And Settlement › Payment Orchestration  
**BIAN id:** `48782`  
**Business Area:** Operations  
**Business Domain:** Clearing And Settlement

**API.** No semantic API published for this Service Domain in BIAN release 14.0.0.

### Service Domain: Card Financial Settlement

**Path:** Operations › Clearing And Settlement › Card Financial Settlement  
**BIAN id:** `48918`  
**Business Area:** Operations  
**Business Domain:** Clearing And Settlement

**What it does.** This service domain orchestrates the settlement of the transactions between the Issuers and the Acquirers through the Card Networks.

**API.** Published as `CardFinancialSettlement.yaml` (OpenAPI 3 and AsyncAPI 3) — control record CardFinancialSettlementProcedure; behavior qualifiers Consolidation, Instruction, Payment, Processing; 12 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/CardFinancialSettlement.yaml)

### Service Domain: Card eCommerce Gateway

**Path:** Operations › Clearing And Settlement › Card eCommerce Gateway  
**BIAN id:** `49258`  
**Business Area:** Operations  
**Business Domain:** Clearing And Settlement

**What it does.** This service domain orchestrates the processing of e-commerce transactions for authentication, authorization and capture of the financial transactions.

**API.** Published as `CardeCommerceGateway.yaml` (OpenAPI 3 and AsyncAPI 3) — control record eCommerceGatewayOperatingSession; behavior qualifiers CardAuthentication, CardPayment, TransactionAuthorization, TransactionBatch; 14 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/CardeCommerceGateway.yaml)

## Business Domain: Accounting Services

`146470` — part of the Operations Business Area. Contains 12 Service Domains: Securities Position Keeping, Position Keeping, Customer Position, Account Reconciliation, Fraud Diagnosis, Commissions, Financial Accounting, Financial Statement Assessment, Reward Points Account, Fraud Evaluation, Accounts Receivable, Customer Tax Handling.

### Service Domain: Securities Position Keeping

**Path:** Operations › Accounting Services › Securities Position Keeping  
**BIAN id:** `31819`  
**Business Area:** Operations  
**Business Domain:** Accounting Services

**What it does.** This service domain maintains a securities transaction log to support securities investment activity

**API.** Published as `SecuritiesPositionKeeping.yaml` (OpenAPI 3 and AsyncAPI 3) — control record SecuritiesPositionLog; behavior qualifiers SecuritiesTransactionCapture; 7 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/SecuritiesPositionKeeping.yaml)

### Service Domain: Position Keeping

**Path:** Operations › Accounting Services › Position Keeping  
**BIAN id:** `34193`  
**Business Area:** Operations  
**Business Domain:** Accounting Services

**What it does.** This service domain maintains a log of monetary or value transactions and entitlements log posted to product facilities. Reconciled financial transactions are subsequently used for posting to the accounting systems.

**API.** Published as `PositionKeeping.yaml` (OpenAPI 3 and AsyncAPI 3) — control record FinancialPositionLog; behavior qualifiers FinancialTransactionCapture; 7 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/PositionKeeping.yaml)

### Service Domain: Customer Position

**Path:** Operations › Accounting Services › Customer Position  
**BIAN id:** `34382`  
**Business Area:** Operations  
**Business Domain:** Accounting Services

**What it does.** This service domain maintains a consolidated financial position for a customer, combining details from all products and services in use. The position can cover available funds, credit, collateral, tax exposure and other financial measures as necessary

**API.** Published as `CustomerPosition.yaml` (OpenAPI 3 and AsyncAPI 3) — control record CustomerPositionState; behavior qualifiers Cashflow, CollateralAllocation, Credit; 19 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/CustomerPosition.yaml)

### Service Domain: Account Reconciliation

**Path:** Operations › Accounting Services › Account Reconciliation  
**BIAN id:** `35449`  
**Business Area:** Operations  
**Business Domain:** Accounting Services

**What it does.** This Service Domain handles account reconciliation tasks

**API.** Published as `AccountReconciliation.yaml` (OpenAPI 3 and AsyncAPI 3) — control record AccountReconciliationProcedure; behavior qualifiers AccountAssessment, AccountResolution; 22 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/AccountReconciliation.yaml)

### Service Domain: Fraud Diagnosis

**Path:** Operations › Accounting Services › Fraud Diagnosis  
**BIAN id:** `37084`  
**Business Area:** Operations  
**Business Domain:** Accounting Services

**What it does.** This service domain handles the evaluation of detected possible fraud to support an appropriate response to contain the exposure

**API.** Published as `FraudDiagnosis.yaml` (OpenAPI 3 and AsyncAPI 3) — control record FraudDiagnosisAnalysis; behavior qualifiers AnalystReview, CustomerBehavior, EconomicModel; 9 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/FraudDiagnosis.yaml)

### Service Domain: Commissions

**Path:** Operations › Accounting Services › Commissions  
**BIAN id:** `38615`  
**Business Area:** Operations  
**Business Domain:** Accounting Services

**What it does.** The service domain processes commissions for transactions for eligible employees

**API.** Published as `Commissions.yaml` (OpenAPI 3 and AsyncAPI 3) — control record CommissionTransaction; behavior qualifiers Calculation, Confirmation, Payment; 17 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/Commissions.yaml)

### Service Domain: Financial Accounting

**Path:** Operations › Accounting Services › Financial Accounting  
**BIAN id:** `39161`  
**Business Area:** Operations  
**Business Domain:** Accounting Services

**What it does.** The Financial Accounting Service Domain takes in financial facts and based on these, creates accounting instructions that will update the general ledger and sub ledger accounts

**API.** Published as `FinancialAccounting.yaml` (OpenAPI 3 and AsyncAPI 3) — control record FinancialBookingLog; behavior qualifiers LedgerPosting; 7 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/FinancialAccounting.yaml)

### Service Domain: Financial Statement Assessment

**Path:** Operations › Accounting Services › Financial Statement Assessment  
**BIAN id:** `39371`  
**Business Area:** Operations  
**Business Domain:** Accounting Services

**What it does.** This Service Domain supports a range of financial analyses that can be used to extract specific insights (e.g. valuations, liquidity, risk, market sensitivities) from an entity's financial statements

**API.** Published as `FinancialStatementAssessment.yaml` (OpenAPI 3 and AsyncAPI 3) — control record FinancialStatementAssessment; behavior qualifiers AssetandLiabilityValuationTest, LiquidityandCashFlowTest, RiskTest, SensitivityTest; 26 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/FinancialStatementAssessment.yaml)

### Service Domain: Reward Points Account

**Path:** Operations › Accounting Services › Reward Points Account  
**BIAN id:** `44154`  
**Business Area:** Operations  
**Business Domain:** Accounting Services

**What it does.** Administer the booking and remittance of rewards points

**API.** Published as `RewardPointsAccount.yaml` (OpenAPI 3 and AsyncAPI 3) — control record RewardPointsLog; behavior qualifiers Capture, Expiration; 16 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/RewardPointsAccount.yaml)

### Service Domain: Fraud Evaluation

**Path:** Operations › Accounting Services › Fraud Evaluation  
**BIAN id:** `44625`  
**Business Area:** Operations  
**Business Domain:** Accounting Services

**What it does.** The service domain executes fraud behavioral pattern tests to detect possible fraudulent transactions/activity

**API.** Published as `FraudEvaluation.yaml` (OpenAPI 3 and AsyncAPI 3) — control record FraudEvaluationAssessment; behavior qualifiers Models, RuleSetsandDecisionTrees; 8 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/FraudEvaluation.yaml)

### Service Domain: Accounts Receivable

**Path:** Operations › Accounting Services › Accounts Receivable  
**BIAN id:** `48762`  
**Business Area:** Operations  
**Business Domain:** Accounting Services

**What it does.** This service domain handles accounts receivable for invoices issue by the bank to customers and partners. It includes follow-up and resolution activity for delayed/missed payments

**API.** Published as `AccountsReceivable.yaml` (OpenAPI 3 and AsyncAPI 3) — control record AccountsReceivableProcedure; behavior qualifiers CustomerNegotiation, Payment, ReceivablesEvaluation, Resolution; 22 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/AccountsReceivable.yaml)

### Service Domain: Customer Tax Handling

**Path:** Operations › Accounting Services › Customer Tax Handling  
**BIAN id:** `49508`  
**Business Area:** Operations  
**Business Domain:** Accounting Services

**What it does.** This service domain handles consumer tax reporting obligations including the consolidation and reporting of customer tax related financial activity

**API.** Published as `CustomerTaxHandling.yaml` (OpenAPI 3 and AsyncAPI 3) — control record CustomerTaxObligationFacility; behavior qualifiers Analysis, Consolidation, Reporting; 14 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/CustomerTaxHandling.yaml)
