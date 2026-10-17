# Product Owner Specification: Order Desk

## 1. Business Context <!-- SECTION: Business Context -->

### Problem Statement <!-- SECTION: Problem Statement -->

Clerks capture phone orders on paper and retype them, which takes 12 minutes per order and produces errors in 6% of orders. Customers call the branch to ask where their order is. Order Desk gives clerks a screen to capture and validate orders, and gives customers a self-service page to follow their order in real time.

## 3. Business Objectives <!-- SECTION: Business Objectives -->

### Primary Business Goals <!-- SECTION: Primary Business Goals -->

1. Reduce order capture time from 12 minutes to 4 minutes per order by Q2 2027.
2. Reduce orders with errors from 6% to 1% by Q2 2027.
3. Halve the calls customers make to ask for their order status by Q4 2027.

## 4. Use Cases <!-- SECTION: Use Cases -->

### UC-01: Capture an order

**Description**: A clerk captures a customer's phone order in Order Desk.

**Actors**: Clerk

**Trigger**: The clerk selects New order.

**Primary Flow**:
1. The clerk searches the customer by phone number and selects them.
2. The clerk adds products by product code and quantity.
3. The system shows the order total: the sum of each product's catalog price times its quantity, plus 15% tax.
4. The clerk confirms the order.
5. The system sends the customer an order confirmation SMS with the order number and a link to the tracking page.

**Postconditions**: The order is stored with status Captured and its order number is shown to the clerk.

**Acceptance Criteria**:
- An order with three products is captured in under 4 minutes.

### UC-02: Validate an order

**Description**: Order Desk checks each order before it is accepted.

**Actors**: Clerk, Order Desk

**Trigger**: The clerk confirms an order.

**Primary Flow**:
1. The system checks that every product code exists in the product catalog.
2. The system checks that each requested quantity does not exceed the stock the product catalog records for that product.
3. The system reads the customer's invoices from the billing system and checks that none has status Unpaid with a due date more than 30 days past.

**Alternative Flows**:
- If a product code does not exist, the order keeps status Captured and the system shows "Unknown product code" next to the line.
- If a quantity exceeds stock, the order keeps status Captured and the system shows the stock the product catalog records for that product next to the line.
- If the customer has an overdue unpaid invoice, the order keeps status Captured and the system shows "Customer has an overdue invoice".

**Postconditions**: The order passes all three checks and its status changes from Captured to Accepted.

**Acceptance Criteria**:
- An order with an unknown product code is never accepted.

### UC-03: Track an order

**Description**: A customer follows their order without calling the branch.

**Actors**: Customer

**Trigger**: The customer opens the tracking link sent in the order confirmation SMS.

**Primary Flow**:
1. The customer enters the order number.
2. The system shows the order status: Captured, Accepted, Dispatched, Delivered or Cancelled.
3. When the status changes, the page shows the new status within 5 seconds, without the customer reloading it.

**Postconditions**: The customer sees the current status of the order.

**Acceptance Criteria**:
- A status change made in Order Desk appears on the tracking page within 5 seconds.

### UC-04: Cancel an order

**Description**: A supervisor cancels an order before dispatch.

**Actors**: Supervisor

**Trigger**: The customer asks the branch to cancel the order.

**Primary Flow**:
1. The supervisor opens the order and selects Cancel.
2. The system asks for a cancellation reason from the list: Customer request, Duplicate, Out of stock.

**Alternative Flows**:
- If the order has status Dispatched or Delivered, the system rejects the cancellation and shows "Order already dispatched".

**Postconditions**: The order has status Cancelled and the reason is recorded.

**Acceptance Criteria**:
- A Captured or Accepted order is cancelled in under 30 seconds.

### UC-05: Dispatch and deliver an order

**Description**: The warehouse records when an accepted order leaves and when it reaches the customer.

**Actors**: Warehouse clerk, Driver

**Trigger**: The warehouse clerk hands an Accepted order to a driver.

**Primary Flow**:
1. The warehouse clerk scans the order number and the order status changes from Accepted to Dispatched.
2. The driver hands the order to the customer and scans the order number, and the order status changes from Dispatched to Delivered.

**Alternative Flows**:
- If the scanned order does not have status Accepted, the system rejects the scan and shows "Order not ready for dispatch".

**Postconditions**: The order has status Delivered and the dispatch and delivery times are recorded.

**Acceptance Criteria**:
- A scanned order shows its new status on the tracking page within 5 seconds.

### Out of Scope <!-- SECTION: Out of Scope -->

- Online ordering by customers.

## 7. Business Constraints <!-- SECTION: Business Constraints -->

### Technology Constraints <!-- SECTION: Technology Constraints -->

- Order Desk runs in the web browser on the clerks' existing PCs.
- The tracking page works on mobile phones without installing an app.

## 8. Success Metrics & KPIs <!-- SECTION: Success Metrics and KPIs -->

### Business KPIs <!-- SECTION: Business KPIs -->

| KPI | Baseline | Target |
|---|---|---|
| Average order capture time | 12 minutes | 4 minutes |
| Orders with errors | 6% | 1% |
| Order status calls per week | 400 | 200 |
