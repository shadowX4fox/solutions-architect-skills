// the analysis fills behind docs/images/analysis/ and the showcase: all ten lenses in Order Desk's names — a SPOF report with a heat map and a latency report whose flow runs over
// its target, for the synthetic Order Desk showcase; then the same latency report with one hop raised to critical, for the
// verdict picture. bun analysis-fills.js <dir> → spof, latency, latency-raised, blast, bottleneck, cost, coupling, data, stride, techdebt, vendor .fill.json
const fs=require('fs'),S=process.argv[2]||'.';
const proj={name:"Order Desk — Architecture",version:"1.2.0",status:"Released",source:"ARCHITECTURE.md"};
const base=(lens)=>({lens,language:"en",today:"2026-11-02",project:proj,citations:["ARCHITECTURE.md","docs/05-integration-points.md"]});
fs.writeFileSync(S+'/spof.fill.json',JSON.stringify({...base("spof"),
 summary:["Order DB and API Gateway each run as one instance on the order path.","Hub API is a partner dependency with no fallback documented."],
 sections:{
  "Critical SPOFs":{rows:[
   {id:"C1",cells:{Component:"`Order DB`",["Failure Scenario"]:"Primary node lost",Impact:"No order can be placed or read",["Current Mitigation"]:"None documented"}},
   {id:"C2",cells:{Component:"`API Gateway`",["Failure Scenario"]:"Single replica crashes",Impact:"Web App loses every API",["Current Mitigation"]:"Restart by the orchestrator"}}]},
  "Degradation SPOFs":{rows:[
   {id:"D1",cells:{Component:"`Outbox Relay`",["Failure Scenario"]:"Worker stalls",Impact:"Settlement delayed; orders still accepted",["Current Mitigation"]:"Outbox keeps events"}},
   {id:"D2",cells:{Component:"`Hub API`",["Failure Scenario"]:"Partner unavailable",Impact:"Payments queue up",["Current Mitigation"]:"None documented"}}]},
  "Operational SPOFs":{rows:[
   {id:"O1",cells:{Component:"`Order Service`",["Failure Scenario"]:"One deploy pipeline, no rollback stated",Impact:"A bad release stays live"}}]}},
 heatmap:[{id:"C1",x:2,y:3},{id:"C2",x:3,y:3},{id:"D1",x:2,y:2},{id:"D2",x:3,y:2},{id:"O1",x:1,y:2}],
 recommendations:[{id:"C1",title:"Add a standby for Order DB",body:"A synchronous replica with automatic failover.",source:"docs/09 § 11.5"},{id:"C2",title:"Run API Gateway with two replicas",body:"Behind the load balancer already in the deployment view.",source:"docs/08"}],
 verdict:"Two critical single points on the order path; both are fixed by redundancy the platform already offers.",
 gaps:[{subject:"`Order DB`",missing:"RTO and RPO",where:"docs/09 § 11.5"}]}));
fs.writeFileSync(S+'/latency.fill.json',JSON.stringify({...base("latency-budget"),
 summary:["Place an order runs at 480 ms p95 against a 400 ms target.","Order Service carries most of the overage."],
 sections:{
  "Per-Flow Budget Breakdown":{blocks:[
   {title:"Flow 1 — Place an order (target ≤ 400 ms)",text:"Three phases; one hop over its share.",table:{columns:["Hop #","Component","p95 (ms)","Status"],rows:[["1","`Web App`","60","within"],["2","`API Gateway`","40","within"],["3","`Order Service`","230","over"],["4","`Order DB`","90","tight"],["5","`Fraud Screen`","60","within"]]}},
   {title:"Flow 2 — Settle (target ≤ 2 s)",text:"Asynchronous; within budget.",table:{columns:["Hop #","Component","p95 (ms)","Status"],rows:[["1","`Outbox Relay`","300","within"],["2","`Hub API`","700","within"],["3","`Hub Ledger`","Not documented","untracked"]]}}]},
  "Hops Over Budget":{rows:[{id:"OB-01",cells:{Flow:"Place an order","Hop #":"3",Component:"`Order Service`","p95 (ms)":"230","Proportional Share (ms)":"150","Overage (ms)":"80",Severity:"High"}}]},
  "Tail-Latency Hotspots":{rows:[{id:"TL-01",cells:{Component:"`Order DB`","Flow(s)":"Place an order","p95 (ms)":"90","p99 (ms)":"260","p99/p95 Ratio":"2.9","Risk":"Medium"}}]}},
 recommendations:[{id:"OB-01",title:"Cache the catalogue read in Order Service",body:"Removes one Order DB round trip per order.",source:"docs/04 § Phase 3"}],
 verdict:"One flow over target by 80 ms, all of it in one hop.",
 gaps:[{subject:"`Hub Ledger`",missing:"p95",where:"docs/06"}]}));
const raised = JSON.parse(fs.readFileSync(S + '/latency.fill.json', 'utf8'));
raised.today = '2026-11-03';
raised.sections['Per-Flow Budget Breakdown'].blocks[0].table.rows[3] = ['4', '`Order DB`', '140', 'over'];
raised.sections['Hops Over Budget'].rows.push({ id: 'OB-02', cells: { Flow: 'Place an order', 'Hop #': '4', Component: '`Order DB`', 'p95 (ms)': '140', 'Proportional Share (ms)': '80', 'Overage (ms)': '60', Severity: 'Critical' } });
fs.writeFileSync(S + '/latency-raised.fill.json', JSON.stringify(raised));

// 11.10.0 — the other eight lenses, so the showcase answers every figure analysis-chart.js draws: each lens's own figure, one
// finding by its id (C1 · B1 · B2-01 · P-01 · K3-01 · G2-01 · T1-D · T1-01 · L1-01) and one STRIDE boundary (TB-01 … TB-03)
const put = (name, lens, o) => fs.writeFileSync(`${S}/${name}.fill.json`, JSON.stringify({ ...base(lens), today: '2026-11-03', ...o }));
const row = (id, cells) => ({ id, cells }), inv = (cells) => ({ cells });

put('blast', 'blast-radius', {
  summary: ['Order DB reaches every flow that places or settles an order.', 'API Gateway is the one door for the Web App; it fails closed.'],
  sections: {
    'High-Blast Components': { rows: [
      row('B1', { Component: '`Order DB` (SPOF C1)', Tier: 'S1', 'Direct Consumers': '`Order Service`, `Outbox Relay`', 'Indirect Consumers': '`API Gateway`, `Web App`, `Hub API`', 'Total Blast Fan-out': '5', 'Cascade Risk': 'Cascading', 'Bulkhead Present': 'No' }),
      row('B2', { Component: '`API Gateway` (SPOF C2)', Tier: 'S2', 'Direct Consumers': '`Web App`', 'Indirect Consumers': 'None', 'Total Blast Fan-out': '1', 'Cascade Risk': 'Fail-closed', 'Bulkhead Present': 'Yes — per-route rate limits' }),
      row('B3', { Component: '`Hub API`', Tier: 'S3', 'Direct Consumers': '`Order Service`', 'Indirect Consumers': '`API Gateway`, `Web App`', 'Total Blast Fan-out': '3', 'Cascade Risk': 'Partial', 'Bulkhead Present': 'Timeouts, no circuit breaker' })] },
    'Isolated Components': { rows: [inv({ Component: '`Hub Ledger`', Type: 'Database', 'Why Isolated': 'Reached only through Hub API; I-07 is retired' })] },
    'Cascade Paths': { blocks: [{ title: 'Scenario 1 — Order DB lost', text: 'Order Service fails every write; Outbox Relay stops; the Web App shows errors.', mermaid: 'flowchart TB\n  DB["Order DB"] --> OS["Order Service"]\n  DB --> OR["Outbox Relay"]\n  OS --> GW["API Gateway"]\n  GW --> WA["Web App"]' }] },
    'MTTR Estimate': { rows: [inv({ Component: '`Order DB`', 'Failure Type': 'Primary lost', 'Estimated MTTR': 'Not documented', Source: 'docs/09 § 11.5' }), inv({ Component: '`API Gateway`', 'Failure Type': 'Replica crash', 'Estimated MTTR': '1 min (orchestrator restart)', Source: 'docs/08' })] },
    'Bulkhead Recommendations': { rows: [row('B1', { Component: '`Order DB`', 'Recommended Pattern': 'Read replica for the catalogue reads', 'Trade-off': 'Replica lag on reads', 'ADR Reference': 'ADR-101' }), row('B3', { Component: '`Hub API`', 'Recommended Pattern': 'Circuit breaker in Order Service', 'Trade-off': 'Orders queue while open', 'ADR Reference': '—' })] } },
  heatmap: [{ id: 'B1', x: 4, y: 4 }, { id: 'B2', x: 1, y: 1 }, { id: 'B3', x: 3, y: 2 }],
  recommendations: [{ id: 'B3', title: 'Break the circuit to Hub API', body: 'Keeps a partner outage out of the order path.', source: 'docs/05 § I-03' }],
  verdict: 'One component cascades to every flow; one partner call has no breaker.', gaps: [{ subject: '`Order DB`', missing: 'MTTR', where: 'docs/09' }] });

put('bottleneck', 'bottleneck', {
  summary: ['Order DB runs one replica at 300 rps against a 240 rps peak with a factor of 2.', 'Order Service scales to 6 replicas; its CPU autoscaler lags a burst.'],
  sections: {
    'Top Chokepoints': { rows: [
      row('B1-01', { Tier: 'B1', Component: '`Order DB`', 'Max RPS / Limit': '300 rps, 1 replica', 'Current HPA': 'None (single primary)', 'Fan-in Count': '2', 'Bottleneck Reason': 'Peak demand 480 rps exceeds the one primary', 'ADR Reference': 'ADR-101' }),
      row('B2-01', { Tier: 'B2', Component: '`Hub API`', 'Max RPS / Limit': '200 rps partner quota', 'Current HPA': 'Partner-managed', 'Fan-in Count': '1', 'Bottleneck Reason': 'Partner quota below the peak payment rate', 'ADR Reference': '—' })] },
    'Scaling Risk Components': { rows: [row('B3-01', { Tier: 'B3', Component: '`Order Service`', 'Scale Blocker': 'CPU autoscaler, 60 s window', 'Fan-in Count': '1', Recommendation: 'Scale on request rate' })] },
    'Capacity Headroom Summary': { rows: [
      inv({ Component: '`Web App`', 'Current Load (est.)': '480 rps', 'Max Capacity': '3200 rps', 'Headroom %': '85%', 'Risk Level': 'Low' }),
      inv({ Component: '`API Gateway`', 'Current Load (est.)': '480 rps', 'Max Capacity': '3600 rps', 'Headroom %': '87%', 'Risk Level': 'Low' }),
      inv({ Component: '`Order Service`', 'Current Load (est.)': '480 rps', 'Max Capacity': '900 rps', 'Headroom %': '47%', 'Risk Level': 'B3' }),
      inv({ Component: '`Order DB`', 'Current Load (est.)': '480 rps', 'Max Capacity': '300 rps', 'Headroom %': '0%', 'Risk Level': 'B1' }),
      inv({ Component: '`Hub API`', 'Current Load (est.)': 'Not documented', 'Max Capacity': '200 rps', 'Headroom %': 'Not documented', 'Risk Level': 'B2' })] } },
  recommendations: [{ id: 'B1-01', title: 'Add a read replica to Order DB', body: 'Moves the catalogue reads off the primary.', source: 'docs/08' }],
  verdict: 'The order path tops out at Order DB, below the documented peak.', gaps: [{ subject: '`Hub API`', missing: 'current load', where: 'docs/08' }] });

put('cost', 'cost-hotspots', {
  summary: ['Order DB and the partner hub carry 72% of the documented monthly cost.'],
  sections: {
    'Pareto Cost Table': { rows: [
      row('P-01', { 'Component / Service': '`Order DB`', 'Monthly Cost': '$4,200', 'Data Quality': 'Documented', Vendor: 'Cloud provider', 'Cumulative %': '42%', Category: 'Database' }),
      row('P-02', { 'Component / Service': '`Hub API`', 'Monthly Cost': '$3,000', 'Data Quality': 'Documented', Vendor: 'Microsoft', 'Cumulative %': '72%', Category: 'Integration' }),
      row('P-03', { 'Component / Service': '`Order Service`', 'Monthly Cost': '$1,600', 'Data Quality': 'Estimated', Vendor: 'Cloud provider', 'Cumulative %': '88%', Category: 'Compute' }),
      row('P-04', { 'Component / Service': '`API Gateway`', 'Monthly Cost': '$800', 'Data Quality': 'Documented', Vendor: 'Kong', 'Cumulative %': '96%', Category: 'Network' }),
      row('P-05', { 'Component / Service': '`Web App`', 'Monthly Cost': '$400', 'Data Quality': 'Estimated', Vendor: 'Cloud provider', 'Cumulative %': '100%', Category: 'Hosting' })] },
    'Qualitative Cost Mentions': { rows: [row('Q-01', { Component: '`Outbox Relay`', 'Cost Mention': 'Two workers always on', Source: 'docs/08', 'Recommended Action': 'Document its monthly cost' })] },
    'Over-Provisioning Candidates': { rows: [row('O-01', { Component: '`Web App`', 'Current Provisioning': '3 replicas, 8 max', 'Utilization (documented)': '15% at peak', ADR: '—', 'Estimated Monthly Waste': '$130' })] },
    'Vendor Concentration Summary': { rows: [inv({ 'Vendor / Provider': 'Cloud provider', 'Monthly Cost': '$6,200', '% of Total': '62%' }), inv({ 'Vendor / Provider': 'Microsoft', 'Monthly Cost': '$3,000', '% of Total': '30%' }), inv({ 'Vendor / Provider': 'Kong', 'Monthly Cost': '$800', '% of Total': '8%' })] } },
  recommendations: [{ id: 'P-01', title: 'Reserve Order DB capacity', body: 'A one-year reservation on a steady database.', source: 'docs/08' }],
  verdict: 'Two lines carry most of the spend; both are steady and can be reserved.', gaps: [{ subject: '`Outbox Relay`', missing: 'monthly cost', where: 'docs/08' }] });

put('coupling', 'coupling', {
  summary: ['Order Service is the hub: three callers in, four dependencies out.'],
  sections: {
    'Edge Direction Convention': { text: 'An edge runs from the caller to the called; a data edge from the producer to the consumer.' },
    'Coupling Metrics': { rows: [
      inv({ Component: '`Order Service`', Scope: 'Order Desk', 'Fan-in (Ca)': '3', 'Fan-out (Ce)': '4', 'Instability (I)': '0.57', Classification: 'K3 god object' }),
      inv({ Component: '`Order DB`', Scope: 'Order Desk', 'Fan-in (Ca)': '2', 'Fan-out (Ce)': '0', 'Instability (I)': '0.00', Classification: 'K1 critical hub' }),
      inv({ Component: '`API Gateway`', Scope: 'Order Desk', 'Fan-in (Ca)': '1', 'Fan-out (Ce)': '2', 'Instability (I)': '0.67', Classification: '—' }),
      inv({ Component: '`Web App`', Scope: 'Order Desk', 'Fan-in (Ca)': '0', 'Fan-out (Ce)': '2', 'Instability (I)': '1.00', Classification: 'K2 volatile leaf' }),
      inv({ Component: '`Outbox Relay`', Scope: 'Order Desk', 'Fan-in (Ca)': '0', 'Fan-out (Ce)': '2', 'Instability (I)': '1.00', Classification: '—' }),
      inv({ Component: '`Hub API`', Scope: 'Payments Hub', 'Fan-in (Ca)': '2', 'Fan-out (Ce)': '1', 'Instability (I)': '0.33', Classification: '—' })] },
    'Critical Hubs': { rows: [row('K1-01', { Component: '`Order DB`', 'Fan-in': '2', 'Instability (I)': '0.00', 'Dependents (list)': '`Order Service`, `Outbox Relay`' })] },
    'Volatile Leaves': { rows: [row('K2-01', { Component: '`Web App`', 'Fan-out': '2', 'Instability (I)': '1.00', 'Dependencies (list)': '`API Gateway`, `Fraud Screen`' })] },
    'God Objects': { rows: [row('K3-01', { Component: '`Order Service`', 'Fan-in': '3', 'Fan-out': '4', 'Instability (I)': '0.57', 'Risk Narrative': 'Every order flow and the payment call meet in one service' })] } },
  recommendations: [{ id: 'K3-01', title: 'Move payment orchestration out of Order Service', body: 'Halves its fan-out.', source: 'docs/05' }],
  verdict: 'One god object and one stable hub; no cycle.', gaps: [] });

put('data', 'data-sensitivity', {
  summary: ['Order DB holds payment references and customer PII; its encryption at rest is not documented.'],
  sections: {
    'Data Inventory': { rows: [
      inv({ 'Store / Queue / Cache': '`Order DB`', Type: 'Database', 'Sensitivity Tier': 'S1', Tags: 'PII, payment', 'Contains (examples)': 'Customer name, address, payment reference', 'Encryption at Rest': 'Not documented', 'Encryption in Transit': 'TLS (JDBC)', 'Retention Policy': '7 years', Source: 'docs/06' }),
      inv({ 'Store / Queue / Cache': '`Hub Ledger`', Type: 'Database', 'Sensitivity Tier': 'S1', Tags: 'payment', 'Contains (examples)': 'Settlement records', 'Encryption at Rest': 'TDE (partner)', 'Encryption in Transit': 'Not documented', 'Retention Policy': 'Not documented', Source: 'docs/05' }),
      inv({ 'Store / Queue / Cache': 'Outbox table', Type: 'Queue', 'Sensitivity Tier': 'S2', Tags: 'order events', 'Contains (examples)': 'Order id, amount', 'Encryption at Rest': 'As Order DB', 'Encryption in Transit': 'TLS', 'Retention Policy': '7 days', Source: 'docs/04' })] },
    'Sensitive Data Flow Map': { rows: [
      inv({ Flow: 'Flow 1 — Place an order', Step: '1', From: '`Web App`', To: '`API Gateway`', Protocol: 'HTTPS', 'Carries Sensitive Data?': 'Yes', 'Encryption in Transit': 'Documented (TLS 1.3)', Gap: 'None' }),
      inv({ Flow: 'Flow 1 — Place an order', Step: '2', From: '`API Gateway`', To: '`Order Service`', Protocol: 'HTTPS', 'Carries Sensitive Data?': 'Yes', 'Encryption in Transit': 'Documented (mTLS)', Gap: 'None' }),
      inv({ Flow: 'Flow 1 — Place an order', Step: '3', From: '`Order Service`', To: '`Order DB`', Protocol: 'JDBC', 'Carries Sensitive Data?': 'Yes', 'Encryption in Transit': 'Documented (TLS)', Gap: 'G2-01' }),
      inv({ Flow: 'Flow 2 — Settle', Step: '1', From: '`Order Service`', To: '`Hub API`', Protocol: 'HTTPS', 'Carries Sensitive Data?': 'Yes', 'Encryption in Transit': 'Documented (TLS)', Gap: 'None' }),
      inv({ Flow: 'Flow 2 — Settle', Step: '2', From: '`Hub API`', To: '`Hub Ledger`', Protocol: 'Not documented', 'Carries Sensitive Data?': 'Yes', 'Encryption in Transit': 'Not documented', Gap: 'G1-01' })] },
    'Encryption Gaps': { rows: [
      row('G1-01', { Gap: 'G1', 'Data Store / Flow': 'Flow 2 step 2', Sensitivity: 'S1', 'Protocol / Storage': 'Not documented', 'Missing Control': 'Encryption in transit Hub API → Hub Ledger', Source: 'docs/05 § I-03' }),
      row('G2-01', { Gap: 'G2', 'Data Store / Flow': '`Order DB`', Sensitivity: 'S1', 'Protocol / Storage': 'PostgreSQL', 'Missing Control': 'Encryption at rest', Source: 'docs/06' })] },
    'Retention Gaps': { rows: [row('G3-01', { 'Data Store': '`Hub Ledger`', 'Documented Retention': 'Not documented', 'Retention Limit': '10 years (payments)', Overage: 'Unknown', Source: 'docs/05' })] } },
  heatmap: [{ id: 'G1-01', x: 3, y: 3 }, { id: 'G2-01', x: 2, y: 3 }, { id: 'G3-01', x: 2, y: 2 }],
  recommendations: [{ id: 'G2-01', title: 'Encrypt Order DB at rest', body: 'The platform volume encryption, stated in docs/06.', source: 'docs/06' }],
  verdict: 'Two S1 gaps: one store at rest, one partner hop in transit.', gaps: [{ subject: '`Hub Ledger`', missing: 'retention policy', where: 'docs/05' }] });

const tm = (id, threat, cat, sev, pass, ctl) => ({ id, cells: { Threat: threat, Category: cat, Severity: sev, Status: pass ? '✅ Pass' : '⚠️ Finding', 'Control / Gap': ctl } });
put('stride', 'stride', {
  summary: ['Three trust boundaries; the public one carries the only high finding.'],
  sections: {
    'Trust Boundary Inventory': { rows: [
      row('TB-01', { Name: 'Web App → API Gateway (I-01)', 'From Zone': 'Internet (the customer\'s browser)', 'To Zone': 'Order Desk edge (`API Gateway`)', 'Auth Mechanism': 'OAuth2 bearer token, TLS 1.3, per-route rate limits', 'Data Classification': 'Customer PII, order contents', Source: 'docs/07 § 9; docs/05 § I-01' }),
      row('TB-02', { Name: 'Order Service → Hub API (I-03)', 'From Zone': 'Order Desk cluster', 'To Zone': 'Partner (`Payments Hub`)', 'Auth Mechanism': 'mTLS with a client certificate', 'Data Classification': 'Payment references, amounts', Source: 'docs/05 § I-03' }),
      row('TB-03', { Name: 'Order Service → Order DB (I-04)', 'From Zone': 'Order Desk cluster', 'To Zone': 'Data tier (`Order DB`)', 'Auth Mechanism': 'Service account, TLS', 'Data Classification': 'Customer PII, payment references', Source: 'docs/05 § I-04' })] },
    'STRIDE Matrix': { groups: [
      { id: 'TB-01', title: 'TB-01 — Web App → API Gateway (I-01)', header: { 'Auth Mechanism': 'OAuth2 bearer token, TLS 1.3', Data: 'Customer PII, order contents' }, rows: [
        tm('—', 'A forged token reaches the API', 'Spoofing', '—', true, 'Tokens signed and validated at the gateway (ADR-102)'),
        tm('—', 'An order altered in transit', 'Tampering', '—', true, 'TLS 1.3 on I-01'),
        tm('T1-R', 'A customer denies placing an order', 'Repudiation', 'Low', false, 'Order audit trail: Not documented'),
        tm('T2-I', 'Order history read through another customer\'s id', 'Information Disclosure', 'Medium', false, 'Object-level authorization: Not documented'),
        tm('T3-D', 'A burst of anonymous orders exhausts Order Service', 'DoS', 'High', false, 'Per-route limits only; no per-client quota'),
        tm('—', 'A customer token reaches admin routes', 'Elevation of Privilege', '—', true, 'Scopes checked per route at the gateway')] },
      { id: 'TB-02', title: 'TB-02 — Order Service → Hub API (I-03)', header: { 'Auth Mechanism': 'mTLS', Data: 'Payment references' }, rows: [
        tm('—', 'A rogue caller impersonates Order Service', 'Spoofing', '—', true, 'mTLS client certificate'),
        tm('T4-T', 'A replayed payment request', 'Tampering', 'Medium', false, 'Idempotency key: Not documented')] },
      { id: 'TB-03', title: 'TB-03 — Order Service → Order DB (I-04)', header: { 'Auth Mechanism': 'Service account', Data: 'Customer PII' }, rows: [
        tm('T5-I', 'A database backup read outside the cluster', 'Information Disclosure', 'Medium', false, 'Encryption at rest: Not documented (G2-01)')] }] },
    'High-Priority Threats': { rows: [row('T3-D', { 'Trust Boundary': 'TB-01 — Web App → API Gateway (I-01)', 'STRIDE Category': 'DoS', 'Threat Description': 'Anonymous order bursts exhaust Order Service.', 'Recommended Mitigation': 'A per-client quota at API Gateway and a queue in front of order creation', 'ADR Reference': 'ADR-102' })] },
    'Security Architecture Strengths': { items: ['Every external call crosses API Gateway.', 'The partner hop is mutually authenticated.'] } },
  heatmap: [{ id: 'T3-D', x: 3, y: 3 }, { id: 'T2-I', x: 3, y: 2 }, { id: 'T1-R', x: 2, y: 1 }, { id: 'T4-T', x: 1, y: 2 }, { id: 'T5-I', x: 1, y: 2 }],
  recommendations: [{ id: 'T3-D', title: 'Quota per client at API Gateway', body: 'Bounds what one client can cost the order path.', source: 'docs/07 § 9' }],
  verdict: 'The public boundary needs a per-client quota; the rest are documentation gaps.', gaps: [{ subject: 'TB-01', missing: 'order audit trail', where: 'docs/07' }] });

put('techdebt', 'tech-debt', {
  summary: ['Spring Boot 3.1 is past its open-source support; Kafka Connect 3.4 ends support this quarter.'],
  sections: {
    'Technology Currency Table': { rows: [
      row('T1-01', { Tier: 'T1', Technology: 'Spring Boot', 'Documented Version': '3.1', 'EOL / End-of-Support Date': '2024-06-30', 'Runway (months)': '-28', 'Component(s) using it': '`Order Service`', Source: 'docs/06', Validation: 'endoflife.date' }),
      row('T2-01', { Tier: 'T2', Technology: 'Kafka Connect', 'Documented Version': '3.4', 'EOL / End-of-Support Date': '2026-12-31', 'Runway (months)': '2', 'Component(s) using it': '`Outbox Relay`', Source: 'docs/06', Validation: 'endoflife.date' }),
      row('T3-01', { Tier: 'T3', Technology: 'Kong', 'Documented Version': 'Not documented', 'EOL / End-of-Support Date': 'Unknown', 'Runway (months)': 'Unknown', 'Component(s) using it': '`API Gateway`', Source: 'docs/06', Validation: '—' }),
      row('T4-01', { Tier: 'T4', Technology: 'PostgreSQL', 'Documented Version': '16', 'EOL / End-of-Support Date': '2028-11-09', 'Runway (months)': '24', 'Component(s) using it': '`Order DB`', Source: 'docs/06', Validation: 'endoflife.date' })] },
    'EOL Hotlist': { rows: [row('T1-01', { Tier: 'T1', Technology: 'Spring Boot', Version: '3.1', 'EOL Date': '2024-06-30', Runway: '-28 months', Risk: 'Critical' }), row('T2-01', { Tier: 'T2', Technology: 'Kafka Connect', Version: '3.4', 'EOL Date': '2026-12-31', Runway: '2 months', Risk: 'High' })] } },
  heatmap: [{ id: 'T1-01', x: 2, y: 3 }, { id: 'T2-01', x: 1, y: 3 }, { id: 'T3-01', x: 1, y: 1 }],
  recommendations: [{ id: 'T1-01', title: 'Move Order Service to a supported Spring Boot', body: 'A minor upgrade within 3.x.', source: 'docs/06' }],
  verdict: 'One runtime past support, one ending this quarter.', gaps: [{ subject: 'Kong', missing: 'version', where: 'docs/06' }] });

put('vendor', 'vendor-lockin', {
  summary: ['Hub API runs on Azure APIM policies; Order DB uses PostgreSQL extensions.'],
  sections: {
    'Vendor Concentration': { rows: [inv({ Vendor: 'Microsoft', 'Component Count': '1', '% of Architecture': '11%', 'Lock Tier Distribution': 'L1: 1' }), inv({ Vendor: 'Cloud provider', 'Component Count': '3', '% of Architecture': '33%', 'Lock Tier Distribution': 'L2: 1 · L3: 2' })] },
    'Locked Capabilities': { rows: [row('L1-01', { 'Component / Capability': '`Hub API`', Vendor: 'Microsoft', 'Proprietary Surface': 'APIM policy XML for routing and transformation', 'Exit Path': 'Rewrite the policies for another gateway', 'Exit Cost': 'High' })] },
    'Lock-prone Capabilities': { rows: [row('L2-01', { 'Component / Capability': '`Order DB`', Vendor: 'Cloud provider', 'Open Standard Used': 'SQL, PostgreSQL wire protocol', 'Vendor Extension': 'PostgreSQL extensions, managed backups and IAM login', 'Migration Risk': 'Medium' })] },
    'Portable Components': { rows: [inv({ Component: '`Order Service`', Standard: 'Containers, HTTP', 'Alternative Provider(s)': 'Any Kubernetes' }), inv({ Component: '`Web App`', Standard: 'Static assets', 'Alternative Provider(s)': 'Any CDN' })] },
    'Exit Cost Ranking': { rows: [row('L1-01', { Component: '`Hub API`', Vendor: 'Microsoft', 'Exit Cost': 'High', 'Blocking Factor': 'Partner-owned; policies not exported' }), row('L2-01', { Component: '`Order DB`', Vendor: 'Cloud provider', 'Exit Cost': 'Medium', 'Blocking Factor': 'IAM login to replace' })] } },
  heatmap: [{ id: 'L1-01', x: 3, y: 3 }, { id: 'L2-01', x: 3, y: 2 }],
  recommendations: [{ id: 'L1-01', title: 'Keep a contract test of Hub API', body: 'Makes a gateway move checkable.', source: 'docs/05 § I-03' }],
  verdict: 'One locked capability, owned by the partner; the core is portable.', gaps: [] });
