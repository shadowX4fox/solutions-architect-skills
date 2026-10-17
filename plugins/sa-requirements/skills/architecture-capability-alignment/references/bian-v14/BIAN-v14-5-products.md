# BIAN Service Landscape v14.0.0 — Business Area: Products

This document covers **one** of the eight BIAN Business Areas: **Products** (model id `146501`). It contains 9 Business Domains and 76 Service Domains, 75 of which have a published semantic API.

The eight BIAN Business Areas are: Business Management, Resource Management, Finance And Risk Management, Operations, Products, Customers, Channels, and Business Development. Service Domains belonging to the other seven areas are documented in their own files.

Each Service Domain below states its path, BIAN id and published API. Where an API exists, **What it does.** is that API's own one-line description, from BIAN's semantic API repository (Apache License 2.0). The Service Landscape's role definitions and examples of use are © BIAN and are not bundled: an institution pack supplies the full text (docs/INSTITUTION_PACKS.md).

Source: the taxonomy of the BIAN Service Landscape V14.0 Value Chain View; API descriptions from github.com/bian-official/public (Apache License 2.0).

---

## Business Domain: Market Operations

`146492` — part of the Products Business Area. Contains 9 Service Domains: Trading Book Oversight, Credit Risk Operations, Trade and Price Reporting, Corporate Action, Financial Instrument Valuation, Trade Clearing, Securities Fails Processing, Trade Settlement, Trade Confirmation Matching.

### Service Domain: Trading Book Oversight

**Path:** Products › Market Operations › Trading Book Oversight  
**BIAN id:** `32307`  
**Business Area:** Products  
**Business Domain:** Market Operations

**What it does.** This Service Domain oversees the bank's trading book (a type of account ledger that records details of frequently traded securities held by the bank) to manage the banks market risk

**API.** Published as `TradingBookOversight.yaml` (OpenAPI 3 and AsyncAPI 3) — control record TradingPositionManagementPlan; behavior qualifiers TradingBookAnalysisandReporting, TradingBookRiskMitigation; 20 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/TradingBookOversight.yaml)

### Service Domain: Credit Risk Operations

**Path:** Products › Market Operations › Credit Risk Operations  
**BIAN id:** `33352`  
**Business Area:** Products  
**Business Domain:** Market Operations

**What it does.** This Service Domain monitors counterparty credit limits in the trading unit

**API.** Published as `CreditRiskOperations.yaml` (OpenAPI 3 and AsyncAPI 3) — control record TradingCreditPositionMeasurement; behavior qualifiers TradingCounterpartyCreditLimitIndicator; 10 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/CreditRiskOperations.yaml)

### Service Domain: Trade and Price Reporting

**Path:** Products › Market Operations › Trade and Price Reporting  
**BIAN id:** `33983`  
**Business Area:** Products  
**Business Domain:** Market Operations

**What it does.** This Service Domain operates an automated facility that reports executed market trades to the market place as required by the rules of market participation

**API.** Published as `TradeandPriceReporting.yaml` (OpenAPI 3 and AsyncAPI 3) — control record MarketTradeReportingOperatingSession; behavior qualifiers TransactionReporting; 15 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/TradeandPriceReporting.yaml)

### Service Domain: Corporate Action

**Path:** Products › Market Operations › Corporate Action  
**BIAN id:** `35497`  
**Business Area:** Products  
**Business Domain:** Market Operations

**What it does.** This Service Domain supports the various custodial tasks associated with processing associated corporate actions for customer's with securities held at the bank

**API.** Published as `CorporateAction.yaml` (OpenAPI 3 and AsyncAPI 3) — control record CorporateActionProcedure; behavior qualifiers SecurityDividendPayment, SecurityMergersandAcquisitionAction, SecurityRightsIssueAction, SecuritySpin-OffAction, StockSplitorReversalAction; 43 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/CorporateAction.yaml)

### Service Domain: Financial Instrument Valuation

**Path:** Products › Market Operations › Financial Instrument Valuation  
**BIAN id:** `36225`  
**Business Area:** Products  
**Business Domain:** Market Operations

**What it does.** This Service Domain provides a range of financial asset valuation services

**API.** Published as `FinancialInstrumentValuation.yaml` (OpenAPI 3 and AsyncAPI 3) — control record MarketAssetValuationProcedure; behavior qualifiers AssetValuation, AssetValuationApproachSelection, AssetValuationInformationConsolidation; 29 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/FinancialInstrumentValuation.yaml)

### Service Domain: Trade Clearing

**Path:** Products › Market Operations › Trade Clearing  
**BIAN id:** `37296`  
**Business Area:** Products  
**Business Domain:** Market Operations

**What it does.** This Service Domain handles the back office processes that confirm and notify interested parties that securities and funds are available as traded in anticipation of settlement processing

**API.** Published as `TradeClearing.yaml` (OpenAPI 3 and AsyncAPI 3) — control record TradeClearingProcedure; behavior qualifiers MarketTradeConfirmation, MarketTradeFundsandSecurityAvailabilityAssurance, MarketTradeMatching, MarketTradeOutTradeResolution, MarketTradeSettlementInitiation; 43 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/TradeClearing.yaml)

### Service Domain: Securities Fails Processing

**Path:** Products › Market Operations › Securities Fails Processing  
**BIAN id:** `38790`  
**Business Area:** Products  
**Business Domain:** Market Operations

**What it does.** This Service Domain handles the resolution of clerical and processing errors that lead to failures in the securities trade clearing and settlement processes

**API.** Published as `SecuritiesFailsProcessing.yaml` (OpenAPI 3 and AsyncAPI 3) — control record SecurityTradingFailsProcedure; behavior qualifiers SecuritiesFailAnalysis, SecuritiesFailDetermination; 22 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/SecuritiesFailsProcessing.yaml)

### Service Domain: Trade Settlement

**Path:** Products › Market Operations › Trade Settlement  
**BIAN id:** `43346`  
**Business Area:** Products  
**Business Domain:** Market Operations

**What it does.** This Service Domain handles the final movement of cash and securities between depositories as previously confirmed in the clearing process, in order to settle a market trade

**API.** Published as `TradeSettlement.yaml` (OpenAPI 3 and AsyncAPI 3) — control record TradeSettlementProcedure; behavior qualifiers MarketTradeCashSettlement, MarketTradeSecuritiesSettlement, MarketTradeSettlementConfirmation; 29 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/TradeSettlement.yaml)

### Service Domain: Trade Confirmation Matching

**Path:** Products › Market Operations › Trade Confirmation Matching  
**BIAN id:** `48249`  
**Business Area:** Products  
**Business Domain:** Market Operations

**What it does.** This Service Domain supports the bank's interface to a central market matching and confirmation service whether the bank acts as broker dealer or institutional investor

**API.** Published as `TradeConfirmationMatching.yaml` (OpenAPI 3 and AsyncAPI 3) — control record TradeMatchingOperatingSession; behavior qualifiers TransactionConfirmationAffirmation, TransactionReporting, UnmatchedMarketTradeEscalation; 29 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/TradeConfirmationMatching.yaml)

## Business Domain: Consumer Banking

`146478` — part of the Products Business Area. Contains 9 Service Domains: Brokered Product Proxy, Funeral Policy, Current Account, Currency Exchange, Trust Services, Sales Product, Payment Order Initiation, Claim Administration, Claim Assessment.

### Service Domain: Brokered Product Proxy

**Path:** Products › Consumer Banking › Brokered Product Proxy  
**BIAN id:** `33248`  
**Business Area:** Products  
**Business Domain:** Consumer Banking

**What it does.** This Service Domain oversees all activities associated with the coordinated delivery of 3rd party products and services

**API.** Published as `BrokeredProductProxy.yaml` (OpenAPI 3 and AsyncAPI 3) — 0 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/BrokeredProductProxy.yaml)

### Service Domain: Funeral Policy

**Path:** Products › Consumer Banking › Funeral Policy  
**BIAN id:** `34604`  
**Business Area:** Products  
**Business Domain:** Consumer Banking

**What it does.** The Funeral Policy Service Domain handles the general product maintenance, premium payments and initiates claims processing.

**API.** Published as `FuneralPolicy.yaml` (OpenAPI 3 and AsyncAPI 3) — 0 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/FuneralPolicy.yaml)

### Service Domain: Current Account

**Path:** Products › Consumer Banking › Current Account  
**BIAN id:** `36217`  
**Business Area:** Products  
**Business Domain:** Consumer Banking

**What it does.** This service domain orchestrates a consumer checking/demand deposit account. The typical range of services and fees covers payments and deposits, standing orders, sweeps, liens, check and debit card access.

**API.** Published as `CurrentAccount.yaml` (OpenAPI 3 and AsyncAPI 3) — control record CurrentAccountFacility; behavior qualifiers AmountBlock, Booking, Charge, DebitandCredit, Deposit, Interest, IssuedDevice, Payment, Sweep; 34 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/CurrentAccount.yaml)

### Service Domain: Currency Exchange

**Path:** Products › Consumer Banking › Currency Exchange  
**BIAN id:** `38802`  
**Business Area:** Products  
**Business Domain:** Consumer Banking

**What it does.** Service Domain supports over the counter currency exchange

**API.** Published as `CurrencyExchange.yaml` (OpenAPI 3 and AsyncAPI 3) — control record CurrencyExchangeTransaction; behavior qualifiers DocumentHandling, FXTransactionCapture, Quote; 18 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/CurrencyExchange.yaml)

### Service Domain: Trust Services

**Path:** Products › Consumer Banking › Trust Services  
**BIAN id:** `39795`  
**Business Area:** Products  
**Business Domain:** Consumer Banking

**What it does.** This Service Domain support a range of trust management services offered to high value customers

**API.** Published as `TrustServices.yaml` (OpenAPI 3 and AsyncAPI 3) — control record CorporateTrustServicesFacility; behavior qualifiers CourtLiaison, LoanAgencyandAdministration; 22 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/TrustServices.yaml)

### Service Domain: Sales Product

**Path:** Products › Consumer Banking › Sales Product  
**BIAN id:** `42922`  
**Business Area:** Products  
**Business Domain:** Consumer Banking

**What it does.** A representation of a product as sold to a customer, covering the operational fulfillment requirements

**API.** Published as `SalesProduct.yaml` (OpenAPI 3 and AsyncAPI 3) — control record ProductandServiceAgreement; behavior qualifiers OperationalTerm; 9 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/SalesProduct.yaml)

### Service Domain: Payment Order Initiation

**Path:** Products › Consumer Banking › Payment Order Initiation  
**BIAN id:** `42933`  
**Business Area:** Products  
**Business Domain:** Consumer Banking

**What it does.** This service domain provides a customer payment service. It captures the payer and payee details and other key properties of the payment and initiates the orchestration of the transaction. It provides support for repeating/scheduled payments.

**API.** Published as `PaymentOrderInitiation.yaml` (OpenAPI 3 and AsyncAPI 3) — control record PaymentOrderInitiationTransaction; behavior qualifiers Compliance, Confirmation, OrderInitiation; 7 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/PaymentOrderInitiation.yaml)

### Service Domain: Claim Administration

**Path:** Products › Consumer Banking › Claim Administration  
**BIAN id:** `45974`  
**Business Area:** Products  
**Business Domain:** Consumer Banking

**What it does.** The claim administration Service Domain implements the payment and support obligations of the policy in respect to a verified claim

**API.** Published as `ClaimAdministration.yaml` (OpenAPI 3 and AsyncAPI 3) — 0 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/ClaimAdministration.yaml)

### Service Domain: Claim Assessment

**Path:** Products › Consumer Banking › Claim Assessment  
**BIAN id:** `47521`  
**Business Area:** Products  
**Business Domain:** Consumer Banking

**What it does.** The Claim Assessment Service Domain runs through the required tests to confirm the veracity of a claim made under an insurance policy.

**API.** Published as `ClaimAssessment.yaml` (OpenAPI 3 and AsyncAPI 3) — 0 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/ClaimAssessment.yaml)

## Business Domain: Advisory Services

`146471` — part of the Products Business Area. Contains 5 Service Domains: Consumer Advisory Services, Corporate Finance, Mergers and Acquisitions Advisory, Legal Advisory, Corporate Tax Advisory.

### Service Domain: Consumer Advisory Services

**Path:** Products › Advisory Services › Consumer Advisory Services  
**BIAN id:** `29876`  
**Business Area:** Products  
**Business Domain:** Advisory Services

**What it does.** Offer financial advisory services to consumer customers, possibly for a fee

**API.** Published as `ConsumerAdvisoryServices.yaml` (OpenAPI 3 and AsyncAPI 3) — control record ConsumerAdvice; behavior qualifiers Charge, FinancialPlanning, ProductGuidance, Taxation; 19 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/ConsumerAdvisoryServices.yaml)

### Service Domain: Corporate Finance

**Path:** Products › Advisory Services › Corporate Finance  
**BIAN id:** `32895`  
**Business Area:** Products  
**Business Domain:** Advisory Services

**What it does.** This Service Domain handles the provision of a broad range of financial advisory services to corporate clients

**API.** Published as `CorporateFinance.yaml` (OpenAPI 3 and AsyncAPI 3) — control record CorporateFinanceServicesAdvice; behavior qualifiers CapitalStructuring, StrategicFunding, TacticalFunding, Taxation; 36 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/CorporateFinance.yaml)

### Service Domain: Mergers and Acquisitions Advisory

**Path:** Products › Advisory Services › Mergers and Acquisitions Advisory  
**BIAN id:** `39561`  
**Business Area:** Products  
**Business Domain:** Advisory Services

**What it does.** This Service Domain handles mergers and acquisition, IPO, MBO and LBO projects with the bank acting in the lead and/or subordinate role

**API.** Published as `MergersandAcquisitionsAdvisory.yaml` (OpenAPI 3 and AsyncAPI 3) — control record MergersAndAcquisitionAdvice; behavior qualifiers MergerandAcquisition; 15 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/MergersandAcquisitionsAdvisory.yaml)

### Service Domain: Legal Advisory

**Path:** Products › Advisory Services › Legal Advisory  
**BIAN id:** `39573`  
**Business Area:** Products  
**Business Domain:** Advisory Services

**What it does.** The role of the Service Domain is to provide customers and bank employees with advice on legal aspects of product sales and servicing as well as on planned and executed transactions.

**API.** Published as `LegalAdvisory.yaml` (OpenAPI 3 and AsyncAPI 3) — 0 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/LegalAdvisory.yaml)

### Service Domain: Corporate Tax Advisory

**Path:** Products › Advisory Services › Corporate Tax Advisory  
**BIAN id:** `42252`  
**Business Area:** Products  
**Business Domain:** Advisory Services

**What it does.** A fee or commission based product providing tax specific assessments, advice and guidance for corporate customers

**API.** Published as `CorporateTaxAdvisory.yaml` (OpenAPI 3 and AsyncAPI 3) — control record CorporateTaxAdvice; behavior qualifiers Charge, Taxation; 14 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/CorporateTaxAdvisory.yaml)

## Business Domain: Market Trading

`146494` — part of the Products Business Area. Contains 9 Service Domains: Program Trading, Stock Lending and Repos, Quote Management, Market Order, Dealer Desk, Trader Position Operations, Suitability Checking, Market Order Execution, Market Making.

### Service Domain: Program Trading

**Path:** Products › Market Trading › Program Trading  
**BIAN id:** `30034`  
**Business Area:** Products  
**Business Domain:** Market Trading

**What it does.** This Service Domain supports a program trading capability where the trading decisions are made based on predefined/programmed rules and policies. Manual oversight and monitoring capabilities are supported as appropriate

**API.** Published as `ProgramTrading.yaml` (OpenAPI 3 and AsyncAPI 3) — control record ProgramTradingOperatingSession; behavior qualifiers ProgramTradeExecution, ProgramTradedPortfolioAlgorithm, ProgramTradedPortfolioMaintenance; 29 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/ProgramTrading.yaml)

### Service Domain: Stock Lending and Repos

**Path:** Products › Market Trading › Stock Lending and Repos  
**BIAN id:** `31892`  
**Business Area:** Products  
**Business Domain:** Market Trading

**What it does.** This Service Domain supports the bank offering tri-party repo transactions made between its customers to support their short term capital management requirements

**API.** Published as `StockLendingandRepos.yaml` (OpenAPI 3 and AsyncAPI 3) — control record RepoTransaction; behavior qualifiers RepoTransactionCashTransfer, RepoTransactionInitiation, RepoTransactionSecurityTransfer; 29 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/StockLendingandRepos.yaml)

### Service Domain: Quote Management

**Path:** Products › Market Trading › Quote Management  
**BIAN id:** `37282`  
**Business Area:** Products  
**Business Domain:** Market Trading

**What it does.** This service domain handles the procedure used by traders to obtain and selecting quotes from market makers

**API.** Published as `QuoteManagement.yaml` (OpenAPI 3 and AsyncAPI 3) — control record QuotationProcedure; behavior qualifiers MarketQuoteRequest, MarketQuoteSelection; 22 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/QuoteManagement.yaml)

### Service Domain: Market Order

**Path:** Products › Market Trading › Market Order  
**BIAN id:** `37571`  
**Business Area:** Products  
**Business Domain:** Market Trading

**What it does.** Market Order records an instruction from a customer or his or her representative to buy or sell securities. It follows the order during its lifetime and reports back to the requestor on the execution.

**API.** Published as `MarketOrder.yaml` (OpenAPI 3 and AsyncAPI 3) — control record MarketOrderTransaction; behavior qualifiers Compliance, Confirmation, Quote, TradeInitiation; 8 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/MarketOrder.yaml)

### Service Domain: Dealer Desk

**Path:** Products › Market Trading › Dealer Desk  
**BIAN id:** `38092`  
**Business Area:** Products  
**Business Domain:** Market Trading

**What it does.** The Dealer Workbench represents the bank's dealing desk facility supporting one or more trading lines of activity for both agency and principal trading in all chosen market instruments. It also supports sales and market risk trading desk functions

**API.** Published as `DealerDesk.yaml` (OpenAPI 3 and AsyncAPI 3) — control record DealerDeskOperatingSession; behavior qualifiers DealerDeskConsolidatedPositionTracking, DealerDeskTradingAssignmentandLimits, InformationFeedAdministration; 29 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/DealerDesk.yaml)

### Service Domain: Trader Position Operations

**Path:** Products › Market Trading › Trader Position Operations  
**BIAN id:** `38568`  
**Business Area:** Products  
**Business Domain:** Market Trading

**What it does.** This Service Domain supports the activities of individual traders working within a trading book group

**API.** Published as `TraderPositionOperations.yaml` (OpenAPI 3 and AsyncAPI 3) — control record TradedPositionOperatingSession; behavior qualifiers TradeCaptureandReporting, TradeDealBlotter, TradeQuoteandPricing, TraderSecurityPositionManagementandAnalysis, TraderTradingPermissionsandLimits; 43 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/TraderPositionOperations.yaml)

### Service Domain: Suitability Checking

**Path:** Products › Market Trading › Suitability Checking  
**BIAN id:** `41857`  
**Business Area:** Products  
**Business Domain:** Market Trading

**What it does.** Confirm that all involved counterparties are suitable for a proposed market trade.

**API.** Published as `SuitabilityChecking.yaml` (OpenAPI 3 and AsyncAPI 3) — control record SuitabilityAssessment; 6 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/SuitabilityChecking.yaml)

### Service Domain: Market Order Execution

**Path:** Products › Market Trading › Market Order Execution  
**BIAN id:** `44135`  
**Business Area:** Products  
**Business Domain:** Market Trading

**What it does.** The Market Order Execution Service Domain is responsible for the booking of securities transactions (e.g. resulting from market orders or some types of corporate actions) on investment accounts, so in terms of security name plus quantity.

**API.** Published as `MarketOrderExecution.yaml` (OpenAPI 3 and AsyncAPI 3) — control record MarketTradeTransaction; behavior qualifiers Position, Quote, TradeInitiation; 16 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/MarketOrderExecution.yaml)

### Service Domain: Market Making

**Path:** Products › Market Trading › Market Making  
**BIAN id:** `45971`  
**Business Area:** Products  
**Business Domain:** Market Trading

**What it does.** This Service Domain enables the bank to fulfill its market making function typically in collaboration with a trading exchange. The bank maintains a buy/sell quote for the securities it supports as a market maker and accepts buy/sell orders on request

**API.** Published as `MarketMaking.yaml` (OpenAPI 3 and AsyncAPI 3) — control record MarketMakingFacility; behavior qualifiers Order, PositionTracking, Quote; 29 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/MarketMaking.yaml)

## Business Domain: Corporate Banking

`146479` — part of the Products Business Area. Contains 13 Service Domains: Credit Facility, Cash Management And Account Services, Notional Pooling, Cheque Lock Box, Corporate Payroll Services, Corporate Current Account, Factoring, Corporate Trust Services, Direct Debit Mandate, Virtual Account, Project Finance, Direct Debit, Cash Concentration.

### Service Domain: Credit Facility

**Path:** Products › Corporate Banking › Credit Facility  
**BIAN id:** `29628`  
**Business Area:** Products  
**Business Domain:** Corporate Banking

**What it does.** The Credit Facility Service Domain manages the Credit Facilities that a Corporate Customer has with the bank. A Credit Facility is an agreement between the bank and a (corporate) customer to allow the customer to acquire asset products from the bank up to the limit of the credit facility without the need for a full due diligence and underwriting for each of these products.

**API.** Published as `CreditFacility.yaml` (OpenAPI 3 and AsyncAPI 3) — control record CreditLineFacility; behavior qualifiers Charge, CreditAllocation; 10 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/CreditFacility.yaml)

### Service Domain: Cash Management And Account Services

**Path:** Products › Corporate Banking › Cash Management And Account Services  
**BIAN id:** `30202`  
**Business Area:** Products  
**Business Domain:** Corporate Banking

**What it does.** This service domain orchestrates a cash management and accounting services facility typically used by corporations to support additional cash management features over and above the standard facilities of current and savings accounts

**API.** Published as `CashManagementAndAccountServices.yaml` (OpenAPI 3 and AsyncAPI 3) — control record CashManagementAndAccountServicesFacility; behavior qualifiers AmountBlock, Charge, DebitandCredit, Deposit, Interest, IssuedDevice, Payment, PositivePay, Sweep; 34 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/CashManagementAndAccountServices.yaml)

### Service Domain: Notional Pooling

**Path:** Products › Corporate Banking › Notional Pooling  
**BIAN id:** `31953`  
**Business Area:** Products  
**Business Domain:** Corporate Banking

**What it does.** Notional pooling allows corporate customer with multiple active accounts to pool credit and debit balances to provide a single centralized liquidity position and to minimize interest expense, simplify cash management and retain a degree of local autonomy to the accounts

**API.** Published as `NotionalPooling.yaml` (OpenAPI 3 and AsyncAPI 3) — control record NotionalPoolingFacility; behavior qualifiers CashTransfer; 15 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/NotionalPooling.yaml)

### Service Domain: Cheque Lock Box

**Path:** Products › Corporate Banking › Cheque Lock Box  
**BIAN id:** `32053`  
**Business Area:** Products  
**Business Domain:** Corporate Banking

**What it does.** This Service Domain support paper cheque processing services offered to corporate customers

**API.** Published as `ChequeLockBox.yaml` (OpenAPI 3 and AsyncAPI 3) — control record LockBoxFacility; behavior qualifiers IssueResolution, Payment, TransactionBatch; 25 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/ChequeLockBox.yaml)

### Service Domain: Corporate Payroll Services

**Path:** Products › Corporate Banking › Corporate Payroll Services  
**BIAN id:** `32085`  
**Business Area:** Products  
**Business Domain:** Corporate Banking

**What it does.** The Corporate Payroll Services Service Domain handles payroll payment processing for the employees of a corporate customer.

**API.** Published as `CorporatePayrollServices.yaml` (OpenAPI 3 and AsyncAPI 3) — control record EmployeePaymentServicesFacility; behavior qualifiers IssueResolution; 14 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/CorporatePayrollServices.yaml)

### Service Domain: Corporate Current Account

**Path:** Products › Corporate Banking › Corporate Current Account  
**BIAN id:** `32642`  
**Business Area:** Products  
**Business Domain:** Corporate Banking

**What it does.** This service domain orchestrates a corporate checking/demand deposit account. The typical range of services and fees covers payments and deposits, standing orders, sweeps, liens, check and debit card access.

**API.** Published as `CorporateCurrentAccount.yaml` (OpenAPI 3 and AsyncAPI 3) — control record CorporateCurrentAccountFacility; behavior qualifiers AmountBlock, Booking, Charge, DebitandCredit, Deposit, Interest, IssuedDevice, Payment, Sweep; 34 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/CorporateCurrentAccount.yaml)

### Service Domain: Factoring

**Path:** Products › Corporate Banking › Factoring  
**BIAN id:** `32699`  
**Business Area:** Products  
**Business Domain:** Corporate Banking

**What it does.** This Service Domain supports a factoring service for corporate customers enabling them to convert accounts receivable into immediate funds at a discount

**API.** Published as `Factoring.yaml` (OpenAPI 3 and AsyncAPI 3) — control record FactoringFacility; behavior qualifiers AccountReceivableFactoring, FactoringEvaluation, FactoringProcessing, FactoringPurchase; 36 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/Factoring.yaml)

### Service Domain: Corporate Trust Services

**Path:** Products › Corporate Banking › Corporate Trust Services  
**BIAN id:** `33293`  
**Business Area:** Products  
**Business Domain:** Corporate Banking

**What it does.** This Service Domain provides corporate trust services centered on the handling of debt instruments and escrow account support

**API.** Published as `CorporateTrustServices.yaml` (OpenAPI 3 and AsyncAPI 3) — control record CorporateTrustServicesFacility; behavior qualifiers CourtLiaison, Escrow, Financing, LoanAgencyandAdministration, ProjectFinance; 43 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/CorporateTrustServices.yaml)

### Service Domain: Direct Debit Mandate

**Path:** Products › Corporate Banking › Direct Debit Mandate  
**BIAN id:** `33363`  
**Business Area:** Products  
**Business Domain:** Corporate Banking

**What it does.** This service domains manages the customer mandates associated with direct debit processing for a corporate client

**API.** Published as `DirectDebitMandate.yaml` (OpenAPI 3 and AsyncAPI 3) — control record DirectDebitMandateDirectoryEntry; behavior qualifiers MandateRegistration; 10 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/DirectDebitMandate.yaml)

### Service Domain: Virtual Account

**Path:** Products › Corporate Banking › Virtual Account  
**BIAN id:** `36119`  
**Business Area:** Products  
**Business Domain:** Corporate Banking

**What it does.** A Virtual Account is a bank account that is defined on an underlying real account. It can receive and send payments for the underlying account while behaving towards the outside as a separate account.

**API.** Published as `VirtualAccount.yaml` (OpenAPI 3 and AsyncAPI 3) — control record VirtualAccountFacility; behavior qualifiers AmountBlock, Booking, Charge, DirectDebit, FinancialStatusTracking, Interest, IssuedDevice, Payment; 42 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/VirtualAccount.yaml)

### Service Domain: Project Finance

**Path:** Products › Corporate Banking › Project Finance  
**BIAN id:** `40791`  
**Business Area:** Products  
**Business Domain:** Corporate Banking

**What it does.** This Service Domain fulfills project financing by which major (government) projects can attract privet sector financing

**API.** Published as `ProjectFinance.yaml` (OpenAPI 3 and AsyncAPI 3) — control record ProjectFinanceFacility; behavior qualifiers InstrumentDesign, Maintenance, Placement, Repayment; 36 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/ProjectFinance.yaml)

### Service Domain: Direct Debit

**Path:** Products › Corporate Banking › Direct Debit  
**BIAN id:** `43897`  
**Business Area:** Products  
**Business Domain:** Corporate Banking

**What it does.** Fulfils a direct debit agreement. Handles the creditor side of direct debits.

**API.** Published as `DirectDebit.yaml` (OpenAPI 3 and AsyncAPI 3) — control record DirectDebitFacility; behavior qualifiers PaymentBatch, Reporting; 11 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/DirectDebit.yaml)

### Service Domain: Cash Concentration

**Path:** Products › Corporate Banking › Cash Concentration  
**BIAN id:** `48027`  
**Business Area:** Products  
**Business Domain:** Corporate Banking

**What it does.** Cash Concentration is a cash management service aimed at moving a balance, or part of a balance of an account to a different account to meet various requirements.

**API.** Published as `CashConcentration.yaml` (OpenAPI 3 and AsyncAPI 3) — control record AccountBalanceSweepingFacility; behavior qualifiers CashTransfer; 16 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/CashConcentration.yaml)

## Business Domain: Cards

`146474` — part of the Products Business Area. Contains 8 Service Domains: Card Network Participant Facility, Card Transaction Tracking, Card Transaction Capture, Credit Card, Card Authorization, Merchant Acquiring Facility, Corporate Card Service, Merchant Relations.

### Service Domain: Card Network Participant Facility

**Path:** Products › Cards › Card Network Participant Facility  
**BIAN id:** `36870`  
**Business Area:** Products  
**Business Domain:** Cards

**What it does.** This service domain orchestrates the activities related to the inclusion of new Acquirers and Issuers in the Card Network, their terms and conditions and their status.

**API.** Published as `CardNetworkParticipantFacility.yaml` (OpenAPI 3 and AsyncAPI 3) — control record CardNetworkParticipantAgreement; 4 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/CardNetworkParticipantFacility.yaml)

### Service Domain: Card Transaction Tracking

**Path:** Products › Cards › Card Transaction Tracking  
**BIAN id:** `38595`  
**Business Area:** Products  
**Business Domain:** Cards

**What it does.** Maintain a log of credit card bookings and authorizations for operational and management information, tracking and reconciliation purposes.

**API.** Published as `CardTransactionTracking.yaml` (OpenAPI 3 and AsyncAPI 3) — 0 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/CardTransactionTracking.yaml)

### Service Domain: Card Transaction Capture

**Path:** Products › Cards › Card Transaction Capture  
**BIAN id:** `41420`  
**Business Area:** Products  
**Business Domain:** Cards

**What it does.** A distributed facility to capture card transactions at the point of sale

**API.** Published as `CardTransactionCapture.yaml` (OpenAPI 3 and AsyncAPI 3) — control record CardFinancialCaptureTransaction; behavior qualifiers TransactionAuthorization, TransactionCapture, TransactionConsolidation, TransactionReversal; 22 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/CardTransactionCapture.yaml)

### Service Domain: Credit Card

**Path:** Products › Cards › Credit Card  
**BIAN id:** `41546`  
**Business Area:** Products  
**Business Domain:** Cards

**What it does.** This service domain orchestrates the scheduled maintenance and transactional activities associated with credit card product fulfillment

**API.** Published as `CreditCard.yaml` (OpenAPI 3 and AsyncAPI 3) — control record CreditCardFacility; behavior qualifiers Billing, CardPayment, Charge, CreditPlan, Interest, IssuedDevice, Repayment; 28 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/CreditCard.yaml)

### Service Domain: Card Authorization

**Path:** Products › Cards › Card Authorization  
**BIAN id:** `41757`  
**Business Area:** Products  
**Business Domain:** Cards

**What it does.** This service domain is responsible for the real time card authorization decisions for credit/charge cards.

**API.** Published as `CardAuthorization.yaml` (OpenAPI 3 and AsyncAPI 3) — control record CreditCardAuthorizationAssessment; behavior qualifiers Authentication, Authorization, CreditCheck, DeviceCheck, FraudCheck, StandIn; 16 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/CardAuthorization.yaml)

### Service Domain: Merchant Acquiring Facility

**Path:** Products › Cards › Merchant Acquiring Facility  
**BIAN id:** `44827`  
**Business Area:** Products  
**Business Domain:** Cards

**What it does.** This service domain orchestrates the activities related to Merchant fulfillment, Merchant Account maintenance, Merchant transactional activities and settlement, including the billing of merchant fees and charges.

**API.** Published as `MerchantAcquiringFacility.yaml` (OpenAPI 3 and AsyncAPI 3) — control record MerchantAcquiringFacility; behavior qualifiers Charge, Chargeback, Clearing, Settlement, SupportFacility; 19 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/MerchantAcquiringFacility.yaml)

### Service Domain: Corporate Card Service

**Path:** Products › Cards › Corporate Card Service  
**BIAN id:** `45925`  
**Business Area:** Products  
**Business Domain:** Cards

**API.** No semantic API published for this Service Domain in BIAN release 14.0.0.

### Service Domain: Merchant Relations

**Path:** Products › Cards › Merchant Relations  
**BIAN id:** `47866`  
**Business Area:** Products  
**Business Domain:** Cards

**What it does.** This service domain maintains the terms and conditions agreed with merchants for cards related activity

**API.** Published as `MerchantRelations.yaml` (OpenAPI 3 and AsyncAPI 3) — control record MerchantRelationshipAgreement; behavior qualifiers LegalTerm, OperationalTerm, RegulatoryTerm; 26 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/MerchantRelations.yaml)

## Business Domain: Trade Banking

`146504` — part of the Products Business Area. Contains 3 Service Domains: Letter of Credit, Bank Guarantee, Bank Drafts.

### Service Domain: Letter of Credit

**Path:** Products › Trade Banking › Letter of Credit  
**BIAN id:** `35042`  
**Business Area:** Products  
**Business Domain:** Trade Banking

**What it does.** This Service Domain handles the pricing and issuance of letters of credit to its corporate customers in support of their international trading requirements

**API.** Published as `LetterofCredit.yaml` (OpenAPI 3 and AsyncAPI 3) — control record LetterOfCreditTransaction; behavior qualifiers CustomerCollateralAllocation, CustomerPayment, LetterofCreditDefinitionandPricing, LetterofCreditDemandPayment, LetterofCreditIssuance, SellerObligationConfirmation; 50 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/LetterofCredit.yaml)

### Service Domain: Bank Guarantee

**Path:** Products › Trade Banking › Bank Guarantee  
**BIAN id:** `36142`  
**Business Area:** Products  
**Business Domain:** Trade Banking

**What it does.** This Service Domain handles the pricing and issuance of a broad range of bank guarantee instruments

**API.** Published as `BankGuarantee.yaml` (OpenAPI 3 and AsyncAPI 3) — control record BankGuaranteeTransaction; behavior qualifiers BankGuaranteeDefinitionandPricing, BankGuaranteeIssuanceandBooking, BankGuaranteePayout, Collection, CustomerCollateralAllocation, CustomerPayment; 50 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/BankGuarantee.yaml)

### Service Domain: Bank Drafts

**Path:** Products › Trade Banking › Bank Drafts  
**BIAN id:** `47631`  
**Business Area:** Products  
**Business Domain:** Trade Banking

**What it does.** This Service Domain support bank guaranteed payment transactions such as bank drafts

**API.** Published as `BankDrafts.yaml` (OpenAPI 3 and AsyncAPI 3) — control record BearerDocumentTransaction; behavior qualifiers BankGuaranteedPaymentRemittance, BankGuaranteedPaymentSpecification, BearerDocumentCreationandRegistration, CustomerPayment; 36 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/BankDrafts.yaml)

## Business Domain: Corporate Finance

`146480` — part of the Products Business Area. Contains 6 Service Domains: ECM And DCM, Public Offering, Unit Trust Administration, Hedge Fund Administration, Private Placement, Mutual Fund Administration.

### Service Domain: ECM And DCM

**Path:** Products › Corporate Finance › ECM And DCM  
**BIAN id:** `29442`  
**Business Area:** Products  
**Business Domain:** Corporate Finance

**What it does.** Supports the specification, pricing and issuance of equity and debt (bond) primary capital market products for corporate financing services

**API.** Published as `ECMAndDCM.yaml` (OpenAPI 3 and AsyncAPI 3) — control record ECMAndDCMFacility; behavior qualifiers InstrumentDesign, Placement, Prospectus; 14 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/ECMAndDCM.yaml)

### Service Domain: Public Offering

**Path:** Products › Corporate Finance › Public Offering  
**BIAN id:** `29606`  
**Business Area:** Products  
**Business Domain:** Corporate Finance

**What it does.** This Service Domain supports a broad range of complex financial, accounting and regulatory actions involved in providing advice and practical support to companies going public and/or raising additional capital through the issuance of publicly traded securities

**API.** Published as `PublicOffering.yaml` (OpenAPI 3 and AsyncAPI 3) — control record PublicOfferingFacility; behavior qualifiers Compliance, InstrumentDesign, ItemRegistration, Placement, Prospectus, Underwriting; 50 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/PublicOffering.yaml)

### Service Domain: Unit Trust Administration

**Path:** Products › Corporate Finance › Unit Trust Administration  
**BIAN id:** `37104`  
**Business Area:** Products  
**Business Domain:** Corporate Finance

**What it does.** This Service Domain handles the implementation and fulfillment of unit investment trusts

**API.** Published as `UnitTrustAdministration.yaml` (OpenAPI 3 and AsyncAPI 3) — control record UnitTrustAdministrativePlan; behavior qualifiers FundAccounting, FundEnrolment, FundFinancialReporting, FundInvestor_MiddleandBackOfficeService, FundManagementFee, FundTaxAdministration; 44 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/UnitTrustAdministration.yaml)

### Service Domain: Hedge Fund Administration

**Path:** Products › Corporate Finance › Hedge Fund Administration  
**BIAN id:** `44473`  
**Business Area:** Products  
**Business Domain:** Corporate Finance

**What it does.** The Hedge Fund Administration Service Domain handles all aspects of the set-up and operation of a hedge fund that is offered to accredited investors within the bank's customer base

**API.** Published as `HedgeFundAdministration.yaml` (OpenAPI 3 and AsyncAPI 3) — control record HedgeFundAdministrativePlan; behavior qualifiers FundAccounting, FundDevelopment, FundEnrolmentCertification, FundFinancialReporting, FundInflowsandOutflow, FundInvestor_MiddleandBackOfficeService, FundManagement, FundPerformanceFee, FundTaxAdministration; 62 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/HedgeFundAdministration.yaml)

### Service Domain: Private Placement

**Path:** Products › Corporate Finance › Private Placement  
**BIAN id:** `47513`  
**Business Area:** Products  
**Business Domain:** Corporate Finance

**What it does.** This Service Domain provides the complete range of functions involved in providing private placement services to corporate customers.

**API.** Published as `PrivatePlacement.yaml` (OpenAPI 3 and AsyncAPI 3) — control record PrivatePlacementFacility; behavior qualifiers InstrumentDesign, Maintenance, Placement; 29 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/PrivatePlacement.yaml)

### Service Domain: Mutual Fund Administration

**Path:** Products › Corporate Finance › Mutual Fund Administration  
**BIAN id:** `48953`  
**Business Area:** Products  
**Business Domain:** Corporate Finance

**What it does.** The Mutual Fund Administration Service Domain handles all aspects of the set-up and operation of mutual funds that can be offered to the bank's general (non-accredited) customers

**API.** Published as `MutualFundAdministration.yaml` (OpenAPI 3 and AsyncAPI 3) — control record MutualFundAdministrativePlan; behavior qualifiers FundAccounting, FundDevelopment, FundEnrolment, FundFinancialReporting, FundInflowsandOutflow, FundInvestor_MiddleandBackOfficeService, FundManagementFee, FundTaxAdministration; 56 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/MutualFundAdministration.yaml)

## Business Domain: Loans and Deposits

`146491` — part of the Products Business Area. Contains 14 Service Domains: Syndicated Loan, Underwriting, Consumer Loan, Term Deposit, Mortgage Loan, Corporate Loan, Merchandising Loan, Leasing, Savings Account, Fiduciary Agreement, Standing Order, Loan, Corporate Lease, Leasing Item Administration.

### Service Domain: Syndicated Loan

**Path:** Products › Loans and Deposits › Syndicated Loan  
**BIAN id:** `29294`  
**Business Area:** Products  
**Business Domain:** Loans and Deposits

**What it does.** Handle the processing of syndicated loans with the bank playing the lead coordination role with other syndicate bank members. Note some initial preparation may have been made through prior customer offer processing.

**API.** Published as `SyndicatedLoan.yaml` (OpenAPI 3 and AsyncAPI 3) — control record SyndicatedLoanFacility; behavior qualifiers Fulfillment, InstrumentDesign, Origination, Syndicate; 24 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/SyndicatedLoan.yaml)

### Service Domain: Underwriting

**Path:** Products › Loans and Deposits › Underwriting  
**BIAN id:** `29773`  
**Business Area:** Products  
**Business Domain:** Loans and Deposits

**What it does.** This service domain manages the underwriting decision process for products as appropriate (including many loan types and some insurance products)

**API.** Published as `Underwriting.yaml` (OpenAPI 3 and AsyncAPI 3) — control record UnderwritingAssessment; 7 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/Underwriting.yaml)

### Service Domain: Consumer Loan

**Path:** Products › Loans and Deposits › Consumer Loan  
**BIAN id:** `34300`  
**Business Area:** Products  
**Business Domain:** Loans and Deposits

**What it does.** This service domain handles the fulfillment of a consumer loan product. This includes the initial set-up of the loan facility and the completion of scheduled and ad-hoc product processing tasks

**API.** Published as `ConsumerLoan.yaml` (OpenAPI 3 and AsyncAPI 3) — control record ConsumerLoanFacility; behavior qualifiers AmountBlock, Booking, Charge, DebitandCredit, Disbursement, Interest, IssuedDevice, Maintenance, Modification, Repayment; 29 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/ConsumerLoan.yaml)

### Service Domain: Term Deposit

**Path:** Products › Loans and Deposits › Term Deposit  
**BIAN id:** `38278`  
**Business Area:** Products  
**Business Domain:** Loans and Deposits

**What it does.** A Term Deposit is an interest bearing account into which a customer can place a fixed amount of funds for a fixed amount of time. The Service Domain handles the opening, servicing and maturity processing of a Term Deposit.

**API.** Published as `TermDeposit.yaml` (OpenAPI 3 and AsyncAPI 3) — control record TermDepositFacility; behavior qualifiers AmountBlock, Booking, Charge, DebitandCredit, Deposit, Interest, IssuedDevice, Payments, Rollover, Sweep; 35 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/TermDeposit.yaml)

### Service Domain: Mortgage Loan

**Path:** Products › Loans and Deposits › Mortgage Loan  
**BIAN id:** `39908`  
**Business Area:** Products  
**Business Domain:** Loans and Deposits

**What it does.** Fulfillment of a loan product for the purpose of property purchase. Note different servicing patterns can be applied to interest calculations and principle and interest repayments

**API.** Published as `MortgageLoan.yaml` (OpenAPI 3 and AsyncAPI 3) — control record MortgageLoanFacility; behavior qualifiers AmountBlock, Billing, Booking, Charge, CollateralAllocation, DebitandCredit, Deposit, FinancialStatusTracking, Interest, IssuedDevice, Payment, Sweep; 47 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/MortgageLoan.yaml)

### Service Domain: Corporate Loan

**Path:** Products › Loans and Deposits › Corporate Loan  
**BIAN id:** `40228`  
**Business Area:** Products  
**Business Domain:** Loans and Deposits

**What it does.** This service domain handles the fulfillment of a corporate loan product. This includes the initial set-up of the loan facility and the completion of scheduled and ad-hoc product processing tasks

**API.** Published as `CorporateLoan.yaml` (OpenAPI 3 and AsyncAPI 3) — control record CorporateLoanFacility; behavior qualifiers AmountBlock, Booking, Charge, DebitandCredit, Disbursement, Interest, IssuedDevice, Maintenance, Modification, Repayment; 29 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/CorporateLoan.yaml)

### Service Domain: Merchandising Loan

**Path:** Products › Loans and Deposits › Merchandising Loan  
**BIAN id:** `40284`  
**Business Area:** Products  
**Business Domain:** Loans and Deposits

**What it does.** Fulfillment of loan product used in the purchase of a larger merchandise item such as a car or boat. The purchased item is typically treated as collateral for the loan

**API.** Published as `MerchandisingLoan.yaml` (OpenAPI 3 and AsyncAPI 3) — control record MerchandisingLoanFacility; behavior qualifiers AmountBlock, Billing, Booking, Charge, CollateralAllocation, DebitandCredit, Deposit, FinancialStatusTracking, Interest, IssuedDevice, Payment, Sweep; 47 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/MerchandisingLoan.yaml)

### Service Domain: Leasing

**Path:** Products › Loans and Deposits › Leasing  
**BIAN id:** `42282`  
**Business Area:** Products  
**Business Domain:** Loans and Deposits

**What it does.** The leasing products enables customers to finance equipment purchases using the leased item as collateral when necessary

**API.** Published as `Leasing.yaml` (OpenAPI 3 and AsyncAPI 3) — control record LeasingFacility; behavior qualifiers AmountBlock, Charge, CollateralAllocation, CorporateAction, DebitandCredit, Deposit, FinancialStatusTracking, Interest, IssuedDevice, Payment, Sweep; 44 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/Leasing.yaml)

### Service Domain: Savings Account

**Path:** Products › Loans and Deposits › Savings Account  
**BIAN id:** `42877`  
**Business Area:** Products  
**Business Domain:** Loans and Deposits

**What it does.** This service domain orchestrates a consumer savings account. The typical range of services and fees covers payments from and scheduled and ad-hoc deposits to the account, standing orders, sweeps, and liens.

**API.** Published as `SavingsAccount.yaml` (OpenAPI 3 and AsyncAPI 3) — control record SavingsAccountFacility; behavior qualifiers AmountBlock, Booking, Charge, DebitandCredit, Deposit, Interest, IssuedDevice, Payment, Sweep; 34 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/SavingsAccount.yaml)

### Service Domain: Fiduciary Agreement

**Path:** Products › Loans and Deposits › Fiduciary Agreement  
**BIAN id:** `44476`  
**Business Area:** Products  
**Business Domain:** Loans and Deposits

**What it does.** An agreement where the bank agrees to act on behalf of the customer in a financial matter and in accordance with the agreement terms

**API.** Published as `FiduciaryAgreement.yaml` (OpenAPI 3 and AsyncAPI 3) — behavior qualifiers Charge, Fiduciary; 8 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/FiduciaryAgreement.yaml)

### Service Domain: Standing Order

**Path:** Products › Loans and Deposits › Standing Order  
**BIAN id:** `44674`  
**Business Area:** Products  
**Business Domain:** Loans and Deposits

**What it does.** Customers can issue standing orders to the bank. In most cases this is for the execution of a periodical payment, but there are other standing instructions like, sweeping balances at end of month, topping off excess funds for a current account, etc.

**API.** Published as `StandingOrder.yaml` (OpenAPI 3 and AsyncAPI 3) — control record StandingOrderFacility; behavior qualifiers StandingOrderPayment; 11 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/StandingOrder.yaml)

### Service Domain: Loan

**Path:** Products › Loans and Deposits › Loan  
**BIAN id:** `45523`  
**Business Area:** Products  
**Business Domain:** Loans and Deposits

**What it does.** This service domain handles the fulfillment of a general loan product. This includes the initial set-up of the loan facility and the completion of scheduled and ad-hoc product processing tasks

**API.** Published as `Loan.yaml` (OpenAPI 3 and AsyncAPI 3) — control record LoanFacility; behavior qualifiers Charge, DebitandCredit, Disbursement, Interest, Maintenance, Modification, Repayment; 24 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/Loan.yaml)

### Service Domain: Corporate Lease

**Path:** Products › Loans and Deposits › Corporate Lease  
**BIAN id:** `46100`  
**Business Area:** Products  
**Business Domain:** Loans and Deposits

**What it does.** The Corporate Lease product provides corporate customers with loans to support leasing activity for property and equipment under an umbrella leasing arrangement

**API.** Published as `CorporateLease.yaml` (OpenAPI 3 and AsyncAPI 3) — control record CorporateLeaseFacility; behavior qualifiers Administration, Fulfill; 18 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/CorporateLease.yaml)

### Service Domain: Leasing Item Administration

**Path:** Products › Loans and Deposits › Leasing Item Administration  
**BIAN id:** `47661`  
**Business Area:** Products  
**Business Domain:** Loans and Deposits

**What it does.** Track the status of the assets underlying leasing agreements as they represent collateral items that could be accessed in the event of account recovery

**API.** Published as `LeasingItemAdministration.yaml` (OpenAPI 3 and AsyncAPI 3) — control record LeasingItemAdministrativePlan; behavior qualifiers Assurance, ItemRegistration, Valuation; 20 operations. [Specification](https://github.com/bian-official/public/blob/main/release14.0.0/semantic-apis/oas3%20/yamls/LeasingItemAdministration.yaml)
