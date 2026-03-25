##### Design Drivers

- **Value Delivery:** <Effective change in customer experience.>
    - **Threshold:**
        - Greater than 50% High Impact
        - Less than 50% Low Impact
    - **Impact:**
        - <LOW/HIGH>
- **Scale:** <Estimated number of customers impacted by the change.>
    - **Threshold:**
        - Greater than 100K High Impact
        - Less than 100K Low Impact
    - **Impact:**
        - <LOW/HIGH>
- **Impacts:** <Number of impacts on configuration, development, or implementation in applications.>
    - **Threshold:**
        - Greater than 5 High Impact
        - Less than 5 Low Impact
    - **Impact:**
        - <LOW/HIGH>

##### Architecture Decisions

- **Problem or need:** <Description of the problem or need that prompted the architecture decision>
    - **Decision:** <Description of the decision made>
        - **Technical implications:** <Description of the technical implications of the decision>
        - **Other implications (operational, business, etc):** <Description of non-technical implications>
    - **Evaluated alternatives:**
        - <Description of alternative 1>
        - <Description of alternative N>
    - **Applied criteria or principles:**
        - <Description of criterion or principle 1>
        - <Description of criterion or principle N>
    - **Assumptions:**
        - <Description of assumption 1>
        - <Description of assumption N>

###### Capacity Sizing of Solution Components

- **Parameter:** Number of users (with PO estimation, 6-month to 1-year horizon)
    - **Normal demand:** <Describe normal user demand>
    - **High demand (peak):** <Describe peak user demand, how many users are estimated and when>
- **Parameter:** Transactions per minute (6-month to 1-year horizon)
    - **Normal demand:** <Describe normal transaction demand>
    - **High demand (peak):** <Describe peak transaction demand, how many transactions are estimated and when>
- **Parameter:** Transactional payload (6-month to 1-year horizon)
    - <Describe average payload size per transaction in storage units (bytes)>
- **Parameter:** Operational storage
    - **Minimum:** <Minimum estimated GB of storage in the transactional database>
    - **Maximum:** <Maximum estimated GB of storage in the transactional database>
- **Parameter:** Backup storage
    - **Minimum:** <Minimum estimated GB of backup storage>
    - **Maximum:** <Maximum estimated GB of backup storage>
- **Parameter:** Analytical storage
    - **Minimum:** <Minimum estimated GB of analytical storage>
    - **Maximum:** <Maximum estimated GB of analytical storage>

###### Description

(remaining sections of the component Description are detailed in other paragraphs)

###### Architecture Risks and Debt

- **Architecture Debt:** <Description of the architecture debt>
    - **Justification:** <Description of the justification for the debt's existence>
    - **Risk:** <Description of the risk associated with the debt>
    - **Approximate remediation date:** <Approximate date for debt remediation>

##### Compliance Contract - Approvals

- **Area:** Business Continuity
    - **Status:** <Compliant / Non-compliant / Not applicable>
    - **Observations:** <Detail of observations>

- **Area:** SRE Architecture
    - **Status:** <Compliant / Non-compliant / Not applicable>
    - **Observations:** <Detail of observations>

- **Area:** Cloud Architecture
    - **Status:** <Compliant / Non-compliant / Not applicable>
    - **Observations:** <Detail of observations>

- **Area:** Data & Analytics Architecture - AI
    - **Status:** <Compliant / Non-compliant / Not applicable>
    - **Observations:** <Detail of observations>

- **Area:** Development Architecture
    - **Status:** <Compliant / Non-compliant / Not applicable>
    - **Observations:** <Detail of observations>

- **Area:** Process Transformation and Automation
    - **Status:** <Compliant / Non-compliant / Not applicable>
    - **Observations:** <Detail of observations>

- **Area:** Security Architecture
    - **Status:** <Compliant / Non-compliant / Not applicable>
    - **Observations:** <Detail of observations>

- **Area:** Platforms and IT Infrastructure
    - **Status:** <Compliant / Non-compliant / Not applicable>
    - **Observations:** <Detail of observations>

- **Area:** Enterprise Architecture
    - **Status:** <Compliant / Non-compliant / Not applicable>
    - **Observations:** <Detail of observations>

- **Area:** Integration Architecture
    - **Status:** <Compliant / Non-compliant / Not applicable>
    - **Observations:** <Detail of observations>
