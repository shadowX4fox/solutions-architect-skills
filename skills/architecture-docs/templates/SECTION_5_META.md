# Section 5: Component Details - META Architecture

<!-- ARCHITECTURE_TYPE: META -->

**Purpose**: Deep dive into each component within every META layer, providing detailed technical specifications and operational characteristics.

This template organizes components by their META layer assignment (Channels → UX → Business Scenarios → Integration → Domain → Core).

---

## Component Documentation Guidelines

For each component in your system, document using the template below. **Group components by their layer.**

---

## Layer 1: Channels - Components

### [Component Name]

**Type**: Service | Mobile App | Web Application | API | ATM Interface
**Technology**: [Specific technology used]
**Version**: [Version number]
**Location**: [Package/directory path or repository]

**Purpose**:
[1-2 sentence description of what this component does]

**Responsibilities**:
- Responsibility 1
- Responsibility 2
- Responsibility 3

**APIs/Interfaces**:
- API 1: [Description, endpoints]
- API 2: [Description, endpoints]

**Dependencies**:
- Depends on: [Layer 2 (UX) components]
- Depended by: [End users, external clients]

**Configuration**:
- Config param 1: [Description, default]
- Config param 2: [Description, default]

**Scaling**:
- Horizontal: [Yes/No, approach]
- Vertical: [Limits, approach]

**Failure Modes**:
- Failure 1: [Impact, mitigation]
- Failure 2: [Impact, mitigation]

**Monitoring**:
- Key metrics: [Metrics to track]
- Alerts: [Alert conditions]
- Logs: [What is logged]

---

## Layer 2: User Experience (UX) - Components

### [Component Name]

**Type**: BFF | API Gateway | Session Manager | Experience Orchestrator
**Technology**: [Specific technology used]
**Version**: [Version number]
**Location**: [Package/directory path]

**Purpose**:
[1-2 sentence description of what this component does]

**Responsibilities**:
- Responsibility 1
- Responsibility 2
- Responsibility 3

**APIs/Interfaces**:
- API 1: [Description, endpoints]
- API 2: [Description, endpoints]

**Dependencies**:
- Depends on: [Layer 3 (Business Scenarios) and Layer 4 (Integration) components]
- Depended by: [Layer 1 (Channels) components]

**Configuration**:
- Config param 1: [Description, default]
- Config param 2: [Description, default]

**Scaling**:
- Horizontal: [Yes/No, approach]
- Vertical: [Limits, approach]

**Failure Modes**:
- Failure 1: [Impact, mitigation]
- Failure 2: [Impact, mitigation]

**Monitoring**:
- Key metrics: [Metrics to track]
- Alerts: [Alert conditions]
- Logs: [What is logged]

---

## Layer 3: Business Scenarios - Components

### [Component Name]

**Type**: Orchestrator | Process Engine | Business Rules Engine | Workflow Manager
**Technology**: [Specific technology used]
**Version**: [Version number]
**Location**: [Package/directory path]

**Purpose**:
[1-2 sentence description of what this component does]

**Responsibilities**:
- Responsibility 1
- Responsibility 2
- Responsibility 3

**APIs/Interfaces**:
- API 1: [Description, endpoints]
- API 2: [Description, endpoints]

**Dependencies**:
- Depends on: [Layer 4 (Integration) and Layer 5 (Domain) components]
- Depended by: [Layer 2 (UX) components]

**Configuration**:
- Config param 1: [Description, default]
- Config param 2: [Description, default]

**Scaling**:
- Horizontal: [Yes/No, approach]
- Vertical: [Limits, approach]

**Failure Modes**:
- Failure 1: [Impact, mitigation]
- Failure 2: [Impact, mitigation]

**Monitoring**:
- Key metrics: [Metrics to track]
- Alerts: [Alert conditions]
- Logs: [What is logged]

---

## Layer 4: Integration - Components

### [Component Name]

**Type**: ESB | API Management | Integration Adapter | Message Router
**Technology**: [Specific technology used]
**Version**: [Version number]
**Location**: [Package/directory path]

**Purpose**:
[1-2 sentence description of what this component does]

**Responsibilities**:
- Responsibility 1
- Responsibility 2
- Responsibility 3

**APIs/Interfaces**:
- API 1: [Description, endpoints]
- API 2: [Description, endpoints]

**Dependencies**:
- Depends on: [Layer 5 (Domain), Layer 6 (Core), and external systems]
- Depended by: [Layer 2 (UX) and Layer 3 (Business Scenarios) components]

**Configuration**:
- Config param 1: [Description, default]
- Config param 2: [Description, default]

**Scaling**:
- Horizontal: [Yes/No, approach]
- Vertical: [Limits, approach]

**Failure Modes**:
- Failure 1: [Impact, mitigation]
- Failure 2: [Impact, mitigation]

**Monitoring**:
- Key metrics: [Metrics to track]
- Alerts: [Alert conditions]
- Logs: [What is logged]

---

## Layer 5: Domain - Components

### [Service Domain Name] (BIAN v12)

**Type**: Microservice | Service Domain
**Technology**: [Specific technology used]
**Version**: [Version number]
**Location**: [Package/directory path]
**BIAN ID**: [BIAN Service Domain ID, e.g., SD-001]

**Purpose**:
[1-2 sentence description of BIAN service domain]

**Responsibilities**:
- BIAN service operation 1 (e.g., Initiate)
- BIAN service operation 2 (e.g., Update)
- BIAN service operation 3 (e.g., Retrieve)

**APIs/Interfaces**:
- BIAN API: [BIAN-compliant endpoints]
- Control Record: [Aggregate root description]
- Service Operations: [Initiate, Update, Execute, Request, Retrieve, etc.]

**Dependencies**:
- Depends on: [Layer 6 (Core) systems, other Service Domains]
- Depended by: [Layer 4 (Integration) components]

**BIAN Alignment**:
- Service Domain Model: [BIAN version]
- Behavior Qualifiers: [List behavior qualifiers]
- Functional Patterns: [Which BIAN patterns apply]

**Configuration**:
- Config param 1: [Description, default]
- Config param 2: [Description, default]

**Scaling**:
- Horizontal: [Yes/No, approach]
- Vertical: [Limits, approach]

**Failure Modes**:
- Failure 1: [Impact, mitigation]
- Failure 2: [Impact, mitigation]

**Monitoring**:
- Key metrics: [Metrics to track]
- Alerts: [Alert conditions]
- Logs: [What is logged]

---

## Layer 6: Core - Components

### [Core System Name]

**Type**: Core Banking | Mainframe | Legacy System | Transaction Processor
**Technology**: [Specific technology used]
**Version**: [Version number]
**Location**: [Data center, on-premise, cloud]

**Purpose**:
[1-2 sentence description of core system]

**Responsibilities**:
- Responsibility 1
- Responsibility 2
- Responsibility 3

**APIs/Interfaces**:
- Legacy API: [Description, protocols]
- File Interfaces: [File formats, schedules]
- Batch Processes: [Batch jobs, schedules]

**Dependencies**:
- Depends on: [Other core systems, databases]
- Depended by: [Layer 5 (Domain) components]

**Modernization Plan**:
- Current State: [Assessment]
- Target State: [Goals]
- Migration Approach: [Strategy]

**Configuration**:
- Config param 1: [Description, default]
- Config param 2: [Description, default]

**Scaling**:
- Horizontal: [Typically N/A for legacy]
- Vertical: [Capacity planning]

**Failure Modes**:
- Failure 1: [Impact, mitigation]
- Failure 2: [Impact, mitigation]

**Monitoring**:
- Key metrics: [Metrics to track]
- Alerts: [Alert conditions]
- Logs: [What is logged]

---

## Example: Mobile Banking App (Layer 1: Channels)

### Mobile Banking App

**Type**: Mobile Application
**Technology**: React Native 0.72
**Version**: v3.5.2
**Location**: `apps/mobile-banking/` (example path)

**Purpose**:
Provide retail banking services to customers via iOS and Android mobile devices.

**Responsibilities**:
- User authentication (biometric, PIN, password)
- Account balance and transaction history display
- Fund transfers and bill payments
- Card management and controls
- Push notification handling

**APIs/Interfaces**:
- REST API: Consumes `/api/mobile/v2/*` from Layer 2 (BFF)
- OAuth 2.0: Authentication flow with Auth0
- Push Notifications: Firebase Cloud Messaging (FCM)

**Dependencies**:
- Depends on: Mobile BFF (Layer 2), Auth0 (external)
- Depended by: End-user customers

**Configuration**:
- `API_BASE_URL`: Backend API URL (per environment)
- `OAUTH_CLIENT_ID`: OAuth client identifier
- `SESSION_TIMEOUT`: Inactivity timeout (default: 300s)

**Scaling**:
- Horizontal: N/A (client-side app)
- Vertical: N/A

**Failure Modes**:
- Backend API unavailable: Show cached data, queue requests
- Network connectivity loss: Offline mode with sync on reconnect
- Authentication service down: Users cannot log in, show maintenance message

**Monitoring**:
- Key metrics: Active users, crash rate, API call success rate
- Alerts: Crash rate > 1%, API error rate > 5%
- Logs: All authentication attempts, transaction requests, errors

---

## Guidelines

1. **Document all components** in every layer
2. **Group components by layer** for clarity
3. **BIAN compliance required** for Layer 5 (Domain) components
4. **Include modernization plans** for Layer 6 (Core) legacy systems
5. **Quantify metrics** in Monitoring section (not generic placeholders)
6. **Define failure modes** with realistic mitigation strategies
7. **Cross-reference layers** in Dependencies section

---

## Validation Checklist

- [ ] Components documented for all 6 META layers
- [ ] Each component includes all required subsections
- [ ] Layer 5 (Domain) components include BIAN alignment details
- [ ] Layer 6 (Core) components include modernization strategy
- [ ] Dependencies clearly reference layer numbers
- [ ] Failure modes include realistic impact and mitigation
- [ ] Monitoring includes specific metrics (not placeholders)
- [ ] Example paths updated to match actual project structure